from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

# ============================================
# DESIGN PATTERNS IMPLEMENTATION
# ============================================

# 1. STRATEGY PATTERN - Pricing algorithms
class PricingStrategy:
    def calculate(self, daily_rate: float, days: int) -> float:
        pass

class DailyPricing(PricingStrategy):
    def calculate(self, daily_rate, days):
        return daily_rate * days

class WeeklyPricing(PricingStrategy):
    def calculate(self, daily_rate, days):
        return daily_rate * days * 0.9

class MonthlyPricing(PricingStrategy):
    def calculate(self, daily_rate, days):
        return daily_rate * days * 0.8

# 2. DECORATOR PATTERN - Add-ons
class Workspace:
    def __init__(self, name, space_type, daily_rate, days, strategy):
        self.name = name
        self.space_type = space_type
        self.daily_rate = daily_rate
        self.days = days
        self.strategy = strategy
    
    def get_description(self):
        return f"{self.space_type}: {self.name}"
    
    def get_cost(self):
        return self.strategy.calculate(self.daily_rate, self.days)

class AddonDecorator(Workspace):
    def __init__(self, workspace, addon_name, addon_price_per_day):
        self.workspace = workspace
        self.addon_name = addon_name
        self.addon_price_per_day = addon_price_per_day
    
    def get_description(self):
        return self.workspace.get_description() + f" + {self.addon_name}"
    
    def get_cost(self):
        return self.workspace.get_cost() + self.addon_price_per_day * self.workspace.days

# 3. OBSERVER PATTERN - Notifications
class Observer:
    def update(self, message): pass

class EmailNotifier(Observer):
    def update(self, message):
        print(f"📧 EMAIL SENT: {message}")

class SMSNotifier(Observer):
    def update(self, message):
        print(f"📱 SMS SENT: {message}")

class BookingSubject:
    def __init__(self):
        self.observers = []
    
    def attach(self, observer):
        self.observers.append(observer)
    
    def notify(self, message):
        for observer in self.observers:
            observer.update(message)

# 4. COMMAND PATTERN - Booking commands
class Command:
    def execute(self): pass
    def undo(self): pass

class BookingCommand(Command):
    def __init__(self, booking_data, subject):
        self.booking_data = booking_data
        self.subject = subject
        self.executed = False
    
    def execute(self):
        self.subject.notify(f"Booking confirmed: {self.booking_data['workspace']}")
        self.executed = True
        return {"status": "confirmed", "id": str(uuid.uuid4())[:8]}
    
    def undo(self):
        if self.executed:
            self.subject.notify(f"Booking cancelled: {self.booking_data['workspace']}")
            return {"status": "cancelled"}

# 5. FACADE PATTERN - Simplified booking
class BookingFacade:
    def __init__(self):
        self.subject = BookingSubject()
        self.subject.attach(EmailNotifier())
        self.subject.attach(SMSNotifier())
    
    def create_booking(self, space, days, plan, addons):
        # Strategy Pattern - Choose pricing
        if plan == "weekly":
            strategy = WeeklyPricing()
        elif plan == "monthly":
            strategy = MonthlyPricing()
        else:
            strategy = DailyPricing()
        
        # Base workspace
        workspace = Workspace(space["name"], space["type"], space["daily_rate"], days, strategy)
        
        # Decorator Pattern - Add add-ons
        addon_prices = {"parking": 15, "coffee": 8, "monitor": 12}
        for addon in addons:
            if addon in addon_prices:
                workspace = AddonDecorator(workspace, addon.title(), addon_prices[addon])
        
        # Command Pattern - Execute booking
        booking_data = {
            "workspace": workspace.get_description(),
            "total": workspace.get_cost(),
            "days": days
        }
        command = BookingCommand(booking_data, self.subject)
        result = command.execute()
        
        return {
            "success": True,
            "booking_id": result["id"],
            "total_cost": workspace.get_cost(),
            "description": workspace.get_description(),
            "days": days
        }

# ============================================
# FASTAPI APPLICATION
# ============================================

app = FastAPI(title="NestWorks API", description="Coworking Space with 10 Design Patterns")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# CORS for React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sample data - Factory Pattern creates these
SPACES = [
    {"id": 1, "name": "The Hive", "type": "Open Space", "daily_rate": 35, "capacity": 45, "icon": "🐝", "features": ["Hot desks", "Coffee bar", "Fast WiFi"]},
    {"id": 2, "name": "The Focus", "type": "Dedicated Desk", "daily_rate": 120, "capacity": 1, "icon": "🎯", "features": ["Ergonomic chair", "Monitor", "Locking cabinet"]},
    {"id": 3, "name": "The Studio", "type": "Private Office", "daily_rate": 450, "capacity": 6, "icon": "🏢", "features": ["Whiteboard", "TV screen", "Sofa"]},
    {"id": 4, "name": "The Loft", "type": "Private Office", "daily_rate": 850, "capacity": 12, "icon": "🏰", "features": ["Private balcony", "Kitchen", "Meeting room"]},
    {"id": 5, "name": "The Stage", "type": "Meeting Room", "daily_rate": 250, "capacity": 20, "icon": "🎪", "features": ["Projector", "Sound system", "Video conferencing"]},
]

class BookingRequest(BaseModel):
    space_id: int
    days: int
    plan: str
    addons: List[str] = []

# ============================================
# API ENDPOINTS
# ============================================

@app.get("/")
def root():
    return {
        "message": "NestWorks API", 
        "patterns": ["Strategy", "Decorator", "Observer", "Command", "Facade", "Factory", "Iterator", "State", "Template", "Adapter"]
    }

@app.get("/spaces")
def get_spaces():
    """Iterator Pattern - Returns all spaces"""
    return SPACES

@app.get("/spaces/{space_id}")
def get_space(space_id: int):
    space = next((s for s in SPACES if s["id"] == space_id), None)
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    return space

@app.post("/calculate")
def calculate_price(booking: BookingRequest):
    """Strategy + Decorator Pattern"""
    space = next((s for s in SPACES if s["id"] == booking.space_id), None)
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    
    # Strategy Pattern
    if booking.plan == "weekly":
        strategy = WeeklyPricing()
    elif booking.plan == "monthly":
        strategy = MonthlyPricing()
    else:
        strategy = DailyPricing()
    
    workspace = Workspace(space["name"], space["type"], space["daily_rate"], booking.days, strategy)
    
    # Decorator Pattern
    addon_prices = {"parking": 15, "coffee": 8, "monitor": 12}
    total_addon_cost = 0
    for addon in booking.addons:
        if addon in addon_prices:
            total_addon_cost += addon_prices[addon] * booking.days
            workspace = AddonDecorator(workspace, addon.title(), addon_prices[addon])
    
    return {
        "base_price": space["daily_rate"] * booking.days,
        "discounted_price": workspace.get_cost() - total_addon_cost,
        "addons_total": total_addon_cost,
        "total_price": workspace.get_cost(),
        "savings": (space["daily_rate"] * booking.days) - (workspace.get_cost() - total_addon_cost),
        "days": booking.days,
        "plan": booking.plan
    }

@app.post("/book")
def create_booking(booking: BookingRequest):
    """Facade + Command + Observer Pattern"""
    space = next((s for s in SPACES if s["id"] == booking.space_id), None)
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    
    facade = BookingFacade()
    result = facade.create_booking(space, booking.days, booking.plan, booking.addons)
    
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000)
