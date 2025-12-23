"""
Shipping Label Generator Service

Generates 10x15cm PDF shipping labels for COD orders.
"""

from io import BytesIO
from reportlab.lib.pagesizes import mm
from reportlab.lib import colors
from reportlab.pdfgen import canvas


class LabelService:
    """Service for generating shipping label PDFs."""
    
    # 10cm x 15cm label size
    LABEL_WIDTH = 100 * mm
    LABEL_HEIGHT = 150 * mm
    
    def generate_shipping_label(self, order_data: dict) -> BytesIO:
        """
        Generate a 10x15cm shipping label PDF.
        
        Args:
            order_data: Dict containing order details
                - order_number: str
                - date: str
                - sender_name: str
                - sender_phone: str
                - customer_name: str
                - phone: str
                - address: str
                - city: str
                - items: List[dict] with sku, name, qty
                - cod_amount: float
                - courier: str
        
        Returns:
            BytesIO buffer containing PDF data
        """
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=(self.LABEL_WIDTH, self.LABEL_HEIGHT))
        
        # Margins
        margin = 5 * mm
        width = self.LABEL_WIDTH - (2 * margin)
        y_position = self.LABEL_HEIGHT - margin
        
        # === HEADER - Company Name ===
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(self.LABEL_WIDTH / 2, y_position - 5 * mm, "COD EXPRESS")
        y_position -= 12 * mm
        
        # === Order Number & Date ===
        c.setFont("Helvetica", 8)
        c.drawString(margin, y_position, f"Commande: {order_data.get('order_number', 'N/A')}")
        c.drawRightString(self.LABEL_WIDTH - margin, y_position, f"Date: {order_data.get('date', 'N/A')}")
        y_position -= 8 * mm
        
        # === Line separator ===
        c.setStrokeColor(colors.black)
        c.line(margin, y_position, self.LABEL_WIDTH - margin, y_position)
        y_position -= 5 * mm
        
        # === SENDER INFO ===
        c.setFont("Helvetica-Bold", 9)
        c.drawString(margin, y_position, "EXPÉDITEUR:")
        y_position -= 5 * mm
        c.setFont("Helvetica", 8)
        c.drawString(margin, y_position, order_data.get('sender_name', 'COD Express'))
        y_position -= 4 * mm
        c.drawString(margin, y_position, order_data.get('sender_phone', '+212 600 000 000'))
        y_position -= 8 * mm
        
        # === Line separator ===
        c.line(margin, y_position, self.LABEL_WIDTH - margin, y_position)
        y_position -= 5 * mm
        
        # === RECIPIENT INFO (LARGE) ===
        c.setFont("Helvetica-Bold", 10)
        c.drawString(margin, y_position, "DESTINATAIRE:")
        y_position -= 7 * mm
        
        # Customer Name (Large)
        c.setFont("Helvetica-Bold", 14)
        customer_name = order_data.get('customer_name', 'Client')[:30]
        c.drawString(margin, y_position, customer_name)
        y_position -= 8 * mm
        
        # Phone (VERY LARGE - Important for courier)
        c.setFont("Helvetica-Bold", 18)
        c.drawString(margin, y_position, order_data.get('phone', ''))
        y_position -= 10 * mm
        
        # Address
        c.setFont("Helvetica", 10)
        address_lines = self._wrap_text(order_data.get('address', ''), 40)
        for line in address_lines[:3]:  # Max 3 lines
            c.drawString(margin, y_position, line)
            y_position -= 5 * mm
        
        # City (Bold)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(margin, y_position, order_data.get('city', '').upper())
        y_position -= 12 * mm
        
        # === Line separator ===
        c.line(margin, y_position, self.LABEL_WIDTH - margin, y_position)
        y_position -= 5 * mm
        
        # === PRODUCT INFO ===
        c.setFont("Helvetica-Bold", 9)
        c.drawString(margin, y_position, "PRODUIT:")
        y_position -= 5 * mm
        c.setFont("Helvetica", 9)
        
        items = order_data.get('items', [])
        for item in items[:3]:  # Max 3 items
            item_text = f"{item.get('sku', 'SKU')} - {item.get('name', 'Product')[:25]} x{item.get('qty', 1)}"
            c.drawString(margin, y_position, item_text)
            y_position -= 4 * mm
        
        y_position -= 5 * mm
        
        # === COD AMOUNT (VERY LARGE & BOLD) ===
        c.setFont("Helvetica-Bold", 10)
        c.drawString(margin, y_position, "MONTANT À COLLECTER:")
        y_position -= 10 * mm
        
        # Big box for COD amount
        box_height = 15 * mm
        c.setFillColor(colors.lightgrey)
        c.rect(margin, y_position - box_height + 5 * mm, width, box_height, fill=True, stroke=True)
        c.setFillColor(colors.black)
        c.setFont("Helvetica-Bold", 24)
        cod_amount = order_data.get('cod_amount', 0)
        c.drawCentredString(self.LABEL_WIDTH / 2, y_position - 5 * mm, f"{cod_amount} MAD")
        
        y_position -= 20 * mm
        
        # === COURIER INFO ===
        c.setFont("Helvetica-Bold", 10)
        c.drawString(margin, y_position, f"Transporteur: {order_data.get('courier', 'AMANA')}")
        
        # === BARCODE placeholder (order number) ===
        y_position -= 10 * mm
        c.setFont("Helvetica", 8)
        c.drawCentredString(self.LABEL_WIDTH / 2, y_position, f"|| {order_data.get('order_number', '')} ||")
        
        c.save()
        buffer.seek(0)
        return buffer
    
    def _wrap_text(self, text: str, max_chars: int) -> list:
        """Wrap text to fit in label."""
        if not text:
            return [""]
        words = text.split()
        lines = []
        current_line = ""
        
        for word in words:
            if len(current_line + " " + word) <= max_chars:
                current_line += " " + word if current_line else word
            else:
                lines.append(current_line)
                current_line = word
        
        if current_line:
            lines.append(current_line)
        
        return lines
    
    def generate_bulk_labels(self, orders_data: list) -> BytesIO:
        """Generate multiple labels in one PDF."""
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=(self.LABEL_WIDTH, self.LABEL_HEIGHT))
        
        for i, order_data in enumerate(orders_data):
            if i > 0:
                c.showPage()
            self._draw_label(c, order_data)
        
        c.save()
        buffer.seek(0)
        return buffer
    
    def _draw_label(self, c: canvas.Canvas, order_data: dict):
        """Draw a single label on the current page."""
        # This is a simplified version - for bulk labels
        # Reuses the same logic as generate_shipping_label
        margin = 5 * mm
        y = self.LABEL_HEIGHT - margin - 5 * mm
        
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(self.LABEL_WIDTH / 2, y, "COD EXPRESS")
        y -= 15 * mm
        
        c.setFont("Helvetica-Bold", 12)
        c.drawString(margin, y, order_data.get('customer_name', '')[:25])
        y -= 8 * mm
        
        c.setFont("Helvetica-Bold", 16)
        c.drawString(margin, y, order_data.get('phone', ''))
        y -= 8 * mm
        
        c.setFont("Helvetica", 10)
        c.drawString(margin, y, order_data.get('city', '').upper())
        y -= 20 * mm
        
        c.setFont("Helvetica-Bold", 20)
        c.drawCentredString(self.LABEL_WIDTH / 2, y, f"{order_data.get('cod_amount', 0)} MAD")
