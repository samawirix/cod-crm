"""
Seed script to create sample leads for the COD CRM system
Generates 500 realistic Moroccan leads with proper distribution
"""
import sys
import os
import random
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, Base, engine
from app.models.lead import Lead, LeadStatus


def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")


def seed_leads():
    """Create 500 sample leads with realistic Moroccan data"""
    db = SessionLocal()
    
    try:
        # Check if leads already exist
        existing_leads = db.query(Lead).count()
        if existing_leads > 0:
            print(f"⚠️  {existing_leads} leads already exist in database. Skipping seed.")
            return
        
        # Moroccan names (first names)
        first_names = [
            "Ahmed", "Fatima", "Youssef", "Salma", "Omar", "Aicha", "Mohamed", "Khadija",
            "Hassan", "Zineb", "Ali", "Naima", "Karim", "Hakima", "Rachid", "Latifa",
            "Mustapha", "Malika", "Abdel", "Samira", "Hicham", "Nadia", "Said", "Zakia",
            "Brahim", "Fadila", "Abdellah", "Khadija", "Yassine", "Amina", "Noureddine", "Houda",
            "Tarik", "Souad", "Jamal", "Naima", "Reda", "Zakia", "Adil", "Khadija",
            "Hakim", "Samira", "Younes", "Fatima", "Anas", "Aicha", "Mehdi", "Zineb",
            "Bilal", "Nadia", "Othman", "Malika", "Walid", "Hakima", "Hamza", "Latifa"
        ]
        
        # Moroccan last names
        last_names = [
            "Bennani", "Alami", "Chraibi", "Benjelloun", "Tazi", "Bouazza", "Lahlou", "Benkirane",
            "Bennouna", "Alaoui", "Chakir", "Benchekroun", "Touil", "Bouhaddi", "Lahcen", "Benkaddour",
            "Bennani", "Alami", "Chraibi", "Benjelloun", "Tazi", "Bouazza", "Lahlou", "Benkirane",
            "Bennouna", "Alaoui", "Chakir", "Benchekroun", "Touil", "Bouhaddi", "Lahcen", "Benkaddour",
            "Bennani", "Alami", "Chraibi", "Benjelloun", "Tazi", "Bouazza", "Lahlou", "Benkirane"
        ]
        
        # Moroccan cities
        cities = [
            "Casablanca", "Rabat", "Marrakech", "Fes", "Tangier", "Agadir", "Meknes", "Oujda",
            "Kenitra", "Tetouan", "Safi", "Mohammedia", "Khouribga", "Beni Mellal", "El Jadida", "Taza",
            "Nador", "Settat", "Larache", "Ksar El Kebir", "Guelmim", "Berrechid", "Ouarzazate", "Sidi Slimane",
            "Errachidia", "Skhirat", "Temara", "Ifrane", "Azrou", "Midelt", "Zagora", "Tinghir"
        ]
        
        # Product names
        products = [
            "Smartwatch Pro", "Wireless Earbuds", "Phone Case Premium", "Power Bank 20000mAh",
            "Bluetooth Speaker", "Phone Stand Adjustable", "Car Phone Mount", "USB-C Cable",
            "Wireless Charger", "Phone Screen Protector", "Laptop Stand", "Mouse Pad Gaming",
            "Keyboard Wireless", "Webcam HD", "Microphone USB", "Headphones Over-Ear",
            "Tablet Stand", "Phone Grip Ring", "Car Charger Fast", "Cable Organizer",
            "Phone Wallet Case", "Bluetooth Adapter", "Phone Lens Kit", "Selfie Stick",
            "Phone Holder Car", "Wireless Mouse", "Laptop Sleeve", "Phone Ring Light",
            "Bluetooth Transmitter", "Phone Mount Magnetic", "Cable Tester", "Phone Cooler"
        ]
        
        # Product descriptions
        product_descriptions = [
            "High-quality premium product with 1-year warranty",
            "Latest technology with advanced features",
            "Durable and reliable for daily use",
            "Compact design with excellent performance",
            "Professional grade equipment for best results",
            "Innovative design with user-friendly interface",
            "Long-lasting battery life and fast charging",
            "Compatible with all major devices",
            "Waterproof and dust-resistant design",
            "Ergonomic design for maximum comfort"
        ]
        
        # Sources
        sources = ["website", "phone", "social_media", "referral", "advertisement", "walk_in"]
        
        # Status distribution weights
        status_weights = {
            LeadStatus.NEW: 60,        # 60%
            LeadStatus.CONFIRMED: 25,  # 25%
            LeadStatus.SHIPPED: 8,     # 8%
            LeadStatus.DELIVERED: 6,   # 6%
            LeadStatus.RETURNED: 1     # 1%
        }
        
        # Generate leads
        leads_to_create = []
        base_date = datetime.utcnow() - timedelta(days=30)
        
        print("🌱 Generating 500 sample leads...")
        
        for i in range(500):
            # Random customer data
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            customer_name = f"{first_name} {last_name}"
            city = random.choice(cities)
            
            # Generate Moroccan phone number (+212 format)
            phone_prefix = random.choice(["6", "7"])
            phone_suffix = ''.join([str(random.randint(0, 9)) for _ in range(8)])
            customer_phone = f"+212{phone_prefix}{phone_suffix}"
            
            # Random product
            product_name = random.choice(products)
            product_description = random.choice(product_descriptions)
            
            # Random amount between 100-800 MAD
            amount = Decimal(str(random.randint(100, 800)))
            
            # Random date within last 30 days
            random_days = random.randint(0, 30)
            created_at = base_date + timedelta(days=random_days, hours=random.randint(0, 23), minutes=random.randint(0, 59))
            
            # Random status based on weights
            status = random.choices(
                list(status_weights.keys()),
                weights=list(status_weights.values()),
                k=1
            )[0]
            
            # Set timestamps based on status
            confirmed_at = None
            shipped_at = None
            delivered_at = None
            
            if status in [LeadStatus.CONFIRMED, LeadStatus.SHIPPED, LeadStatus.DELIVERED]:
                confirmed_at = created_at + timedelta(hours=random.randint(1, 48))
                
            if status in [LeadStatus.SHIPPED, LeadStatus.DELIVERED]:
                shipped_at = confirmed_at + timedelta(hours=random.randint(2, 72))
                
            if status == LeadStatus.DELIVERED:
                delivered_at = shipped_at + timedelta(hours=random.randint(6, 120))
            
            # Create lead
            lead = Lead(
                customer_name=customer_name,
                customer_phone=customer_phone,
                customer_email=f"{first_name.lower()}.{last_name.lower()}@email.com",
                city=city,
                address=f"Rue {random.choice(['Mohammed V', 'Hassan II', 'Ibn Battuta', 'Al Andalus', 'Zerktouni'])} {random.randint(1, 200)}, {city}",
                product_name=product_name,
                product_description=product_description,
                amount=amount,
                status=status,
                created_at=created_at,
                confirmed_at=confirmed_at,
                shipped_at=shipped_at,
                delivered_at=delivered_at,
                notes=f"Customer interested in {product_name}",
                source=random.choice(sources)
            )
            
            leads_to_create.append(lead)
            
            if (i + 1) % 100 == 0:
                print(f"   Generated {i + 1}/500 leads...")
        
        # Insert leads in batches
        print("💾 Inserting leads into database...")
        batch_size = 100
        for i in range(0, len(leads_to_create), batch_size):
            batch = leads_to_create[i:i + batch_size]
            db.add_all(batch)
            db.commit()
            print(f"   Inserted batch {i//batch_size + 1}/{(len(leads_to_create) + batch_size - 1)//batch_size}")
        
        # Verify insertion
        total_leads = db.query(Lead).count()
        print(f"\n✅ Successfully created {total_leads} sample leads!")
        
        # Show distribution
        print("\n📊 Lead Status Distribution:")
        for status in LeadStatus:
            count = db.query(Lead).filter(Lead.status == status).count()
            percentage = (count / total_leads) * 100
            print(f"   {status.value}: {count} ({percentage:.1f}%)")
        
        print(f"\n🏙️  Cities covered: {len(set(lead.city for lead in leads_to_create))}")
        print(f"📱 Products: {len(set(lead.product_name for lead in leads_to_create))}")
        print(f"💰 Amount range: 100-800 MAD")
        print(f"📅 Date range: Last 30 days")
        
    except Exception as e:
        print(f"❌ Error creating seed leads: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def main():
    """Main seed function"""
    print("🌱 Starting lead seeding...")
    
    try:
        # Create tables
        create_tables()
        
        # Seed leads
        seed_leads()
        
        print("\n🎉 Lead seeding completed successfully!")
        print("🚀 You can now test the analytics dashboard with real data.")
        
    except Exception as e:
        print(f"❌ Lead seeding failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
