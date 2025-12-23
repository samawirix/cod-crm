"""
CSV Parser Service for Ad Spend Import

Parses Facebook Ads Manager CSV exports and maps columns dynamically.
"""

import pandas as pd
import io
import re
from datetime import datetime
from typing import List, Dict, Any, Tuple


class CSVParseError(Exception):
    """Custom exception for CSV parsing errors."""
    pass


class AdSpendCSVParser:
    """Service for parsing ad spend CSV files."""
    
    # Column mapping: CSV header -> our field name
    COLUMN_MAPPINGS = {
        # Date columns
        'date': 'date',
        'reporting starts': 'date',
        'reporting start': 'date',
        'day': 'date',
        'date_start': 'date',
        
        # Amount columns
        'amount': 'amount',
        'amount spent': 'amount',
        'amount spent (mad)': 'amount',
        'amount spent (usd)': 'amount',
        'spend': 'amount',
        'cost': 'amount',
        'ad spend': 'amount',
        'total spent': 'amount',
        
        # Campaign/Platform columns
        'campaign name': 'campaign_name',
        'campaign': 'campaign_name',
        'campaign_name': 'campaign_name',
        'ad set name': 'ad_set_name',
        'adset name': 'ad_set_name',
        
        # Optional leads column
        'leads': 'leads_generated',
        'results': 'leads_generated',
        'lead': 'leads_generated',
        'conversions': 'leads_generated',
    }
    
    # Platform detection patterns
    PLATFORM_PATTERNS = {
        'FACEBOOK': [r'\bfb\b', r'\bfacebook\b', r'\bmeta\b'],
        'INSTAGRAM': [r'\big\b', r'\binstagram\b', r'\binsta\b', r'\breels\b'],
        'TIKTOK': [r'\btt\b', r'\btiktok\b', r'\btik tok\b'],
        'GOOGLE': [r'\bgoogle\b', r'\bgads\b', r'\bsem\b', r'\bsearch\b'],
        'SNAPCHAT': [r'\bsnap\b', r'\bsnapchat\b'],
    }
    
    def detect_platform(self, campaign_name: str) -> str:
        """Detect platform from campaign name."""
        if not campaign_name:
            return 'FACEBOOK'  # Default
        
        campaign_lower = campaign_name.lower()
        
        for platform, patterns in self.PLATFORM_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, campaign_lower):
                    return platform
        
        return 'FACEBOOK'  # Default fallback
    
    def map_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Map CSV columns to our expected column names."""
        column_renames = {}
        
        for col in df.columns:
            col_lower = col.lower().strip()
            if col_lower in self.COLUMN_MAPPINGS:
                column_renames[col] = self.COLUMN_MAPPINGS[col_lower]
        
        if column_renames:
            df = df.rename(columns=column_renames)
        
        return df
    
    def parse_date(self, date_val: Any, dayfirst: bool = True) -> str:
        """
        Parse various date formats to YYYY-MM-DD string.
        
        Args:
            date_val: The date value to parse
            dayfirst: If True, interpret ambiguous dates as DD/MM/YYYY (European)
                     If False, interpret as MM/DD/YYYY (US)
        """
        if pd.isna(date_val):
            return None
        
        if isinstance(date_val, str):
            date_val = date_val.strip()
            
            # Try explicit formats first (unambiguous)
            unambiguous_formats = [
                '%Y-%m-%d',        # ISO format
                '%Y/%m/%d',        # ISO with slashes
                '%b %d, %Y',       # Jan 15, 2024
                '%B %d, %Y',       # January 15, 2024
                '%d %b %Y',        # 15 Jan 2024
                '%d %B %Y',        # 15 January 2024
            ]
            
            for fmt in unambiguous_formats:
                try:
                    return datetime.strptime(date_val, fmt).strftime('%Y-%m-%d')
                except ValueError:
                    continue
            
            # Use pandas.to_datetime for ambiguous formats with dayfirst hint
            try:
                parsed = pd.to_datetime(date_val, dayfirst=dayfirst, format='mixed')
                return parsed.strftime('%Y-%m-%d')
            except:
                pass
            
            # Fallback: try with opposite dayfirst setting
            try:
                parsed = pd.to_datetime(date_val, dayfirst=not dayfirst, format='mixed')
                return parsed.strftime('%Y-%m-%d')
            except:
                pass
            
            return None
        
        # Handle datetime objects directly
        if hasattr(date_val, 'strftime'):
            return date_val.strftime('%Y-%m-%d')
        
        # Handle pandas Timestamp
        if isinstance(date_val, pd.Timestamp):
            return date_val.strftime('%Y-%m-%d')
        
        return None
    
    def parse_amount(self, amount_val: Any) -> float:
        """Parse amount value, handling various formats."""
        if pd.isna(amount_val):
            return 0.0
        
        if isinstance(amount_val, (int, float)):
            return float(amount_val)
        
        if isinstance(amount_val, str):
            # Remove currency symbols and commas
            cleaned = re.sub(r'[^\d.,\-]', '', amount_val)
            # Handle European format (1.234,56) vs US format (1,234.56)
            if ',' in cleaned and '.' in cleaned:
                if cleaned.index(',') > cleaned.index('.'):
                    # European format
                    cleaned = cleaned.replace('.', '').replace(',', '.')
                else:
                    # US format
                    cleaned = cleaned.replace(',', '')
            elif ',' in cleaned:
                # Could be decimal or thousands separator
                parts = cleaned.split(',')
                if len(parts) == 2 and len(parts[1]) <= 2:
                    # Likely decimal
                    cleaned = cleaned.replace(',', '.')
                else:
                    # Likely thousands separator
                    cleaned = cleaned.replace(',', '')
            
            try:
                return float(cleaned) if cleaned else 0.0
            except ValueError:
                return 0.0
        
        return 0.0
    
    def parse_csv(self, file_content: bytes, dayfirst: bool = True) -> Tuple[List[Dict[str, Any]], List[str]]:
        """
        Parse CSV file content and return list of ad spend records.
        
        Args:
            file_content: Raw bytes of the CSV file
            dayfirst: If True, interpret ambiguous dates as DD/MM/YYYY (European)
                     If False, interpret as MM/DD/YYYY (US)
        
        Returns:
            Tuple of (records, errors)
        """
        errors = []
        records = []
        
        try:
            # Try to read CSV with different encodings
            df = None
            for encoding in ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252']:
                try:
                    df = pd.read_csv(io.BytesIO(file_content), encoding=encoding)
                    break
                except UnicodeDecodeError:
                    continue
            
            if df is None:
                raise CSVParseError("Could not decode CSV file. Please ensure it's UTF-8 encoded.")
            
            # Remove empty rows
            df = df.dropna(how='all')
            
            if df.empty:
                raise CSVParseError("CSV file is empty or contains no valid data.")
            
            # Map columns
            df = self.map_columns(df)
            
            # Check required columns
            if 'date' not in df.columns:
                raise CSVParseError("Missing required 'Date' column. Please include a column named 'Date', 'Reporting Starts', or similar.")
            
            if 'amount' not in df.columns:
                raise CSVParseError("Missing required 'Amount' column. Please include a column named 'Amount Spent', 'Spend', or similar.")
            
            # Process each row
            for idx, row in df.iterrows():
                row_num = idx + 2  # Account for 0-indexing and header row
                
                try:
                    # Parse date with dayfirst parameter
                    date_str = self.parse_date(row.get('date'), dayfirst=dayfirst)
                    if not date_str:
                        errors.append(f"Row {row_num}: Invalid or missing date")
                        continue
                    
                    # Parse amount
                    amount = self.parse_amount(row.get('amount'))
                    if amount <= 0:
                        errors.append(f"Row {row_num}: Invalid or zero amount")
                        continue
                    
                    # Detect platform from campaign name
                    campaign_name = str(row.get('campaign_name', '')).strip()
                    platform = self.detect_platform(campaign_name)
                    
                    # Parse leads if available
                    leads = 0
                    if 'leads_generated' in df.columns:
                        try:
                            leads_val = row.get('leads_generated')
                            if pd.notna(leads_val):
                                leads = int(float(leads_val))
                        except (ValueError, TypeError):
                            pass
                    
                    records.append({
                        'date': date_str,
                        'platform': platform,
                        'amount': round(amount, 2),
                        'leads_generated': leads,
                        'notes': f"Imported from CSV: {campaign_name}" if campaign_name else "Imported from CSV",
                    })
                    
                except Exception as e:
                    errors.append(f"Row {row_num}: {str(e)}")
            
            if not records:
                raise CSVParseError("No valid records found in CSV file.")
            
        except CSVParseError:
            raise
        except Exception as e:
            raise CSVParseError(f"Failed to parse CSV: {str(e)}")
        
        return records, errors
    
    def aggregate_by_date_platform(self, records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Aggregate records by date and platform.
        Combines multiple entries for same date+platform into single record.
        """
        aggregated = {}
        
        for record in records:
            key = (record['date'], record['platform'])
            
            if key not in aggregated:
                aggregated[key] = {
                    'date': record['date'],
                    'platform': record['platform'],
                    'amount': 0,
                    'leads_generated': 0,
                    'notes': record.get('notes', ''),
                }
            
            aggregated[key]['amount'] += record['amount']
            aggregated[key]['leads_generated'] += record['leads_generated']
        
        # Round amounts
        for record in aggregated.values():
            record['amount'] = round(record['amount'], 2)
        
        return list(aggregated.values())
