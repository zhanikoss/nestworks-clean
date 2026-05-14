from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

# ============================================
# DESIGN PATTERNS IMPLEMENTATION
# ============================================

# ===== 1. STRATEGY PATTERN =====
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

# ===== 2. DECORATOR PATTERN =====
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

# ===== 3. OBSERVER PATTERN =====
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

# ===== 4. COMMAND PATTERN =====
class Command:
    def execute(self): pass

class BookingCommand(Command):
    def __init__(self, booking_data, subject):
        self.booking_data = booking_data
        self.subject = subject
    
    def execute(self):
        self.subject.notify(f"Booking confirmed: {self.booking_data['workspace']}")
        return {"status": "confirmed", "id": str(uuid.uuid4())[:8]}

# ===== 5. FACADE PATTERN =====
class BookingFacade:
    def __init__(self):
        self.subject = BookingSubject()
        self.subject.attach(EmailNotifier())
        self.subject.attach(SMSNotifier())
    
    def create_booking(self, space, days, plan, addons):
        if plan == "weekly":
            strategy = WeeklyPricing()
        elif plan == "monthly":
            strategy = MonthlyPricing()
        else:
            strategy = DailyPricing()
        
        workspace = Workspace(space["name"], space["type"], space["daily_rate"], days, strategy)
        
        addon_prices = {"parking": 1500, "coffee": 800, "monitor": 1200}
        for addon in addons:
            if addon in addon_prices:
                workspace = AddonDecorator(workspace, addon.title(), addon_prices[addon])
        
        command = BookingCommand({"workspace": workspace.get_description()}, self.subject)
        result = command.execute()
        
        return {
            "success": True,
            "booking_id": result["id"],
            "total_cost": workspace.get_cost(),
            "description": workspace.get_description(),
            "days": days
        }

# ===== 6. FACTORY PATTERN =====
class SpaceFactory:
    @staticmethod
    def create_spaces():
        return [
            {"id": 1, "name": "The Focus", "type": "Dedicated Desk", "daily_rate": 8000, "capacity": 1, "icon": "🎯", "features": ["Ergonomic chair", "Monitor", "Locking cabinet"]},
            {"id": 2, "name": "The Hive", "type": "Open Space", "daily_rate": 40000, "capacity": 8, "icon": "🐝", "features": ["Hot desks", "Coffee bar", "Fast WiFi"]},
            {"id": 3, "name": "The Garden", "type": "Open Space", "daily_rate": 54000, "capacity": 12, "icon": "🌿", "features": ["Plants", "Natural light", "Quiet zone"]},
            {"id": 4, "name": "The Studio", "type": "Private Office", "daily_rate": 80000, "capacity": 20, "icon": "🏢", "features": ["Whiteboard", "TV screen", "Sofa"]},
            {"id": 5, "name": "The Loft", "type": "Private Office", "daily_rate": 105000, "capacity": 30, "icon": "🏰", "features": ["Private balcony", "Kitchenette", "Meeting table"]},
            {"id": 6, "name": "The Stage", "type": "Meeting Room", "daily_rate": 150000, "capacity": 60, "icon": "🎪", "features": ["Projector", "Sound system", "Video conferencing"]},
        ]

# ===== 7. ITERATOR PATTERN =====
class SpaceIterator:
    def __init__(self, spaces):
        self.spaces = spaces
        self.index = 0
    
    def has_next(self):
        return self.index < len(self.spaces)
    
    def next(self):
        space = self.spaces[self.index]
        self.index += 1
        return space

# ===== 8. TEMPLATE PATTERN =====
class BookingTemplate:
    def process(self, space, days, addons):
        self.validate_booking(space, days)
        self.calculate_price(space, days, addons)
        self.create_booking()
        self.send_confirmation()
    
    def validate_booking(self, space, days):
        pass
    
    def calculate_price(self, space, days, addons):
        pass
    
    def create_booking(self):
        pass
    
    def send_confirmation(self):
        pass

# ===== 9. STATE PATTERN =====
class BookingState:
    def confirm(self): pass
    def cancel(self): pass

class PendingState(BookingState):
    def confirm(self): return ConfirmedState()
    def cancel(self): return CancelledState()

class ConfirmedState(BookingState):
    def confirm(self): return self
    def cancel(self): return CancelledState()

class CancelledState(BookingState):
    def confirm(self): return self
    def cancel(self): return self

# ===== 10. ADAPTER PATTERN =====
class PaymentAdapter:
    @staticmethod
    def format_response(data):
        return {
            "status": data.get("success", True),
            "transaction_id": data.get("booking_id"),
            "amount": data.get("total_cost"),
            "currency": "KZT"
        }

# ============================================
# FASTAPI APPLICATION
# ============================================

app = FastAPI(title="NestWorks API", description="Coworking Space with 10 Design Patterns")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SPACES = SpaceFactory.create_spaces()

class BookingRequest(BaseModel):
    space_id: int
    days: int
    plan: str
    addons: List[str] = []

@app.get("/")
def root():
    return {"message": "NestWorks API", "patterns": ["Strategy", "Decorator", "Observer", "Command", "Facade", "Factory", "Iterator", "Template", "State", "Adapter"]}

@app.get("/spaces")
def get_spaces():
    iterator = SpaceIterator(SPACES)
    spaces = []
    while iterator.has_next():
        spaces.append(iterator.next())
    return spaces

@app.post("/calculate")
def calculate_price(booking: BookingRequest):
    space = next((s for s in SPACES if s["id"] == booking.space_id), None)
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    
    if booking.plan == "weekly":
        strategy = WeeklyPricing()
    elif booking.plan == "monthly":
        strategy = MonthlyPricing()
    else:
        strategy = DailyPricing()
    
    workspace = Workspace(space["name"], space["type"], space["daily_rate"], booking.days, strategy)
    
    addon_prices = {"parking": 1500, "coffee": 800, "monitor": 1200}
    total_addon_cost = 0
    for addon in booking.addons:
        if addon in addon_prices:
            total_addon_cost += addon_prices[addon] * booking.days
            workspace = AddonDecorator(workspace, addon.title(), addon_prices[addon])
    
    return {
        "base_price": space["daily_rate"] * booking.days,
        "addons_total": total_addon_cost,
        "total_price": workspace.get_cost(),
        "savings": (space["daily_rate"] * booking.days) - (workspace.get_cost() - total_addon_cost),
    }

@app.post("/book")
def create_booking(booking: BookingRequest):
    space = next((s for s in SPACES if s["id"] == booking.space_id), None)
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
    
    facade = BookingFacade()
    result = facade.create_booking(space, booking.days, booking.plan, booking.addons)
    
    return PaymentAdapter.format_response(result)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)