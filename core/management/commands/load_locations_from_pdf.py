"""
Django management command to load Israeli locations from government PDF.
Run: python manage.py load_locations_from_pdf
"""
import requests
import pdfplumber
import re
import os
from django.core.management.base import BaseCommand
from core.models import Location

PDF_URL = 'https://www.gov.il/BlobFolder/service/constructions_palestinian_workers_qouta_request/ar/settlments_list.pdf'


class Command(BaseCommand):
    help = 'Loads Israeli cities, towns, and settlements from government PDF'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear all existing locations before loading',
        )
        parser.add_argument(
            '--pdf-path',
            type=str,
            help='Path to local PDF file (if not downloading)',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing locations...')
            Location.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Cleared all locations'))

        # Download or use local PDF
        pdf_path = options.get('pdf_path')
        if not pdf_path:
            self.stdout.write('Downloading PDF from government website...')
            try:
                response = requests.get(PDF_URL, timeout=30)
                response.raise_for_status()
                pdf_path = 'settlements_list.pdf'
                with open(pdf_path, 'wb') as f:
                    f.write(response.content)
                self.stdout.write(self.style.SUCCESS(f'Downloaded PDF to {pdf_path}'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Failed to download PDF: {e}'))
                self.stdout.write('Please download the PDF manually and use --pdf-path option')
                return

        if not os.path.exists(pdf_path):
            self.stdout.write(self.style.ERROR(f'PDF file not found: {pdf_path}'))
            return

        # Extract text from PDF
        self.stdout.write('Extracting locations from PDF...')
        locations = self.extract_locations_from_pdf(pdf_path)
        
        if not locations:
            self.stdout.write(self.style.ERROR('No locations extracted from PDF'))
            return

        # Load locations into database
        self.stdout.write(f'Found {len(locations)} locations. Loading into database...')
        created_count = 0
        skipped_count = 0

        for location_data in locations:
            name_he = (location_data.get('name_he') or '').strip()
            name = (location_data.get('name') or '').strip() or name_he
            location_type = location_data.get('type') or 'town'
            region = (location_data.get('region') or '').strip()

            if not name_he and not name:
                continue

            # Try to determine location type from name or context
            if not location_type:
                if 'קיבוץ' in name_he or 'קיבוץ' in name:
                    location_type = 'kibbutz'
                elif 'מושב' in name_he or 'מושב' in name:
                    location_type = 'moshav'
                elif any(word in name_he for word in ['עיר', 'תל', 'רמת', 'קריית']):
                    location_type = 'city'
                else:
                    location_type = 'town'

            # Try to determine region
            if not region:
                # Simple heuristics based on common patterns
                if any(word in name_he for word in ['צפון', 'גליל', 'נהריה', 'עכו', 'חיפה', 'טבריה']):
                    region = 'צפון'
                elif any(word in name_he for word in ['דרום', 'באר', 'אשדוד', 'אשקלון', 'אילת']):
                    region = 'דרום'
                elif any(word in name_he for word in ['ירושלים', 'בית', 'מעלה']):
                    region = 'ירושלים'
                elif any(word in name_he for word in ['חיפה', 'עכו']):
                    region = 'חיפה'
                else:
                    region = 'מרכז'

            location, created = Location.objects.get_or_create(
                name=name,
                defaults={
                    'name_he': name_he if name_he else name,
                    'location_type': location_type,
                    'region': region,
                }
            )
            if created:
                created_count += 1
                if created_count % 50 == 0:
                    self.stdout.write(f'  Loaded {created_count} locations...')
            else:
                skipped_count += 1

        # Clean up downloaded file
        if pdf_path == 'settlements_list.pdf' and os.path.exists(pdf_path):
            try:
                os.remove(pdf_path)
            except:
                pass

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(
            f'Successfully loaded {created_count} new locations (skipped {skipped_count} existing)'
        ))

    def extract_locations_from_pdf(self, pdf_path):
        """Extract location names from PDF"""
        locations = []
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    text = page.extract_text()
                    if not text:
                        continue
                    
                    # Try to extract location names
                    # This is a basic parser - you may need to adjust based on PDF structure
                    lines = text.split('\n')
                    
                    for line in lines:
                        line = line.strip()
                        if not line or len(line) < 2:
                            continue
                        
                        # Skip headers and footers
                        if any(skip in line.lower() for skip in ['page', 'עמוד', 'רשימה', 'list', 'מספר']):
                            continue
                        
                        # Try to extract Hebrew text (contains Hebrew characters)
                        if re.search(r'[\u0590-\u05FF]', line):
                            # Clean the line
                            line = re.sub(r'[^\u0590-\u05FF\s\w\-\']+', '', line)
                            line = line.strip()
                            
                            if len(line) > 1 and len(line) < 100:  # Reasonable name length
                                # Try to split if there are multiple names
                                parts = re.split(r'[,\s]+', line)
                                for part in parts:
                                    part = part.strip()
                                    if len(part) > 1 and re.search(r'[\u0590-\u05FF]', part):
                                        locations.append({
                                            'name_he': part,
                                            'name': part,  # Will use Hebrew as English name if no translation
                                            'type': None,  # Will be determined automatically
                                            'region': None,  # Will be determined automatically
                                        })
                    
                    if (page_num + 1) % 10 == 0:
                        self.stdout.write(f'  Processed {page_num + 1} pages...')
        
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error extracting from PDF: {e}'))
            return []
        
        # Remove duplicates while preserving order
        seen = set()
        unique_locations = []
        for loc in locations:
            key = loc['name_he'].lower()
            if key not in seen:
                seen.add(key)
                unique_locations.append(loc)
        
        return unique_locations

