from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel

from typing import List

from abc import ABC, abstractmethod

import uuid


class BookingRequest(BaseModel):
    space_id: int
    days: int
    plan: str
    addons: List[str] = []


class Space:
    def __init__(
        self,
        id,
        name,
        space_type,
        daily_rate,
        capacity,
        icon,
        features
    ):
        self.id = id
        self.name = name
        self.space_type = space_type
        self.daily_rate = daily_rate
        self.capacity = capacity
        self.icon = icon
        self.features = features

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "type": self.space_type,
            "daily_rate": self.daily_rate,
            "capacity": self.capacity,
            "icon": self.icon,
            "features": self.features
        }


# 1. STRATEGY PATTERN

class PricingStrategy(ABC):

    @abstractmethod
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


# 2. DECORATOR PATTERN

class WorkspaceComponent(ABC):

    @abstractmethod
    def get_description(self):
        pass

    @abstractmethod
    def get_cost(self):
        pass


class Workspace(WorkspaceComponent):

    def __init__(self, space, days, strategy):
        self.space = space
        self.days = days
        self.strategy = strategy

    def get_description(self):
        return f"{self.space.space_type}: {self.space.name}"

    def get_cost(self):
        return self.strategy.calculate(
            self.space.daily_rate,
            self.days
        )


class AddonDecorator(WorkspaceComponent):

    def __init__(
        self,
        workspace,
        addon_name,
        addon_price_per_day
    ):
        self.workspace = workspace
        self.addon_name = addon_name
        self.addon_price_per_day = addon_price_per_day

    def get_description(self):
        return (
            self.workspace.get_description()
            + f" + {self.addon_name}"
        )

    def get_cost(self):
        return (
            self.workspace.get_cost()
            + self.addon_price_per_day
            * self.workspace.days
        )

    @property
    def days(self):
        return self.workspace.days

# 3. OBSERVER PATTERN

class Observer(ABC):

    @abstractmethod
    def update(self, message):
        pass


class EmailNotifier(Observer):

    def update(self, message):
        print(f"EMAIL SENT: {message}")


class SMSNotifier(Observer):

    def update(self, message):
        print(f"SMS SENT: {message}")


class BookingSubject:

    def __init__(self):
        self.observers = []

    def attach(self, observer):
        self.observers.append(observer)

    def notify(self, message):
        for observer in self.observers:
            observer.update(message)


# 4. COMMAND PATTERN

class Command(ABC):

    @abstractmethod
    def execute(self):
        pass


class BookingCommand(Command):

    def __init__(self, booking_data, subject):
        self.booking_data = booking_data
        self.subject = subject

    def execute(self):

        self.subject.notify(
            f"Booking confirmed: "
            f"{self.booking_data['workspace']}"
        )

        return {
            "status": "confirmed",
            "id": str(uuid.uuid4())[:8]
        }


# 5. FACTORY PATTERN

class SpaceFactory:

    @staticmethod
    def create_spaces():

        return [

            Space(
                1,
                "The Focus",
                "Dedicated Desk",
                3000,
                1,
                "🎯",
                [
                    "Ergonomic chair",
                    "Monitor",
                    "Locking cabinet"
                ]
            ),

            Space(
                2,
                "The Hive",
                "Open Space",
                10000,
                8,
                "🐝",
                [
                    "Hot desks",
                    "Coffee bar",
                    "Fast WiFi"
                ]
            ),

            Space(
                3,
                "The Garden",
                "Open Space",
                15000,
                12,
                "🌿",
                [
                    "Plants",
                    "Natural light",
                    "Quiet zone"
                ]
            ),

            Space(
                4,
                "The Studio",
                "Private Office",
                20000,
                20,
                "🏢",
                [
                    "Whiteboard",
                    "TV screen",
                    "Sofa"
                ]
            ),

            Space(
                5,
                "The Loft",
                "Private Office",
                25000,
                30,
                "🏰",
                [
                    "Private balcony",
                    "Kitchenette",
                    "Meeting table"
                ]
            ),

            Space(
                6,
                "The Stage",
                "Meeting Room",
                35000,
                60,
                "🎪",
                [
                    "Projector",
                    "Sound system",
                    "Video conferencing"
                ]
            )
        ]


# 6. ITERATOR PATTERN

class SpaceIterator:

    def __init__(self, spaces):
        self.spaces = spaces
        self.index = 0

    def __iter__(self):
        return self

    def __next__(self):

        if self.index >= len(self.spaces):
            raise StopIteration

        space = self.spaces[self.index]

        self.index += 1

        return space


# 7. TEMPLATE PATTERN

class BookingTemplate(ABC):

    def process_booking(
        self,
        space,
        days,
        addons
    ):

        self.validate_booking(space, days)

        total = self.calculate_price(
            space,
            days,
            addons
        )

        booking = self.create_booking(space)

        self.send_confirmation(booking)

        return {
            "booking": booking,
            "total": total
        }

    @abstractmethod
    def validate_booking(self, space, days):
        pass

    @abstractmethod
    def calculate_price(
        self,
        space,
        days,
        addons
    ):
        pass

    @abstractmethod
    def create_booking(self, space):
        pass

    @abstractmethod
    def send_confirmation(self, booking):
        pass


class StandardBooking(BookingTemplate):

    def validate_booking(self, space, days):

        if days <= 0:
            raise ValueError(
                "Days must be greater than 0"
            )

    def calculate_price(
        self,
        space,
        days,
        addons
    ):
        return space.daily_rate * days

    def create_booking(self, space):
        return f"BOOK-{uuid.uuid4().hex[:6]}"

    def send_confirmation(self, booking):
        print(
            f"Confirmation sent for booking {booking}"
        )


# 8. STATE PATTERN

class BookingState(ABC):

    @abstractmethod
    def confirm(self):
        pass

    @abstractmethod
    def cancel(self):
        pass


class PendingState(BookingState):

    def confirm(self):
        return ConfirmedState()

    def cancel(self):
        return CancelledState()


class ConfirmedState(BookingState):

    def confirm(self):
        return self

    def cancel(self):
        return CancelledState()


class CancelledState(BookingState):

    def confirm(self):
        return self

    def cancel(self):
        return self


class BookingContext:

    def __init__(self):
        self.state = PendingState()

    def confirm_booking(self):
        self.state = self.state.confirm()

    def cancel_booking(self):
        self.state = self.state.cancel()

    def get_state(self):
        return self.state.__class__.__name__


# 9. ADAPTER PATTERN

class ExternalPaymentAPI:

    def make_payment(self, amount):

        return {
            "payment_status": "success",
            "payment_id": "PAY123",
            "total_amount": amount
        }


class PaymentAdapter:

    def __init__(self, external_api):
        self.external_api = external_api

    def pay(self, amount):

        response = self.external_api.make_payment(
            amount
        )

        return {
            "status":
            response["payment_status"],

            "transaction_id":
            response["payment_id"],

            "amount":
            response["total_amount"],

            "currency":
            "KZT"
        }

# 10. FACADE PATTERN

class BookingFacade:

    def __init__(self):

        self.subject = BookingSubject()

        self.subject.attach(
            EmailNotifier()
        )

        self.subject.attach(
            SMSNotifier()
        )

    def create_booking(
        self,
        space,
        days,
        plan,
        addons
    ):

        if plan == "weekly":
            strategy = WeeklyPricing()

        elif plan == "monthly":
            strategy = MonthlyPricing()

        else:
            strategy = DailyPricing()

        workspace = Workspace(
            space,
            days,
            strategy
        )

        addon_prices = {
            "parking": 1500,
            "coffee": 800,
            "monitor": 1200
        }

        for addon in addons:

            if addon in addon_prices:

                workspace = AddonDecorator(
                    workspace,
                    addon.title(),
                    addon_prices[addon]
                )

        command = BookingCommand(
            {
                "workspace":
                workspace.get_description()
            },
            self.subject
        )

        result = command.execute()

        return {
            "success": True,
            "booking_id": result["id"],
            "total_cost": workspace.get_cost(),
            "description":
            workspace.get_description(),
            "days": days
        }


# =========================================================
# DATA
# =========================================================

SPACES = SpaceFactory.create_spaces()

ADDON_PRICES = {
    "parking": 1500,
    "coffee": 800,
    "monitor": 1200
}


app = FastAPI(
    title="NestWorks API",
    description="Coworking Space with 10 Design Patterns"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():

    return {
        "message": "NestWorks API",
        "patterns": [
            "Strategy",
            "Decorator",
            "Observer",
            "Command",
            "Facade",
            "Factory",
            "Iterator",
            "Template",
            "State",
            "Adapter"
        ]
    }


@app.get("/spaces")
def get_spaces():

    iterator = SpaceIterator(SPACES)

    spaces = []

    for space in iterator:
        spaces.append(space.to_dict())

    return spaces


@app.post("/calculate")
def calculate_price(
    booking: BookingRequest
):

    space = next(
        (
            s for s in SPACES
            if s.id == booking.space_id
        ),
        None
    )

    if not space:

        raise HTTPException(
            status_code=404,
            detail="Space not found"
        )

    if booking.plan == "weekly":
        strategy = WeeklyPricing()

    elif booking.plan == "monthly":
        strategy = MonthlyPricing()

    else:
        strategy = DailyPricing()

    workspace = Workspace(
        space,
        booking.days,
        strategy
    )

    total_addon_cost = 0

    for addon in booking.addons:

        if addon in ADDON_PRICES:

            total_addon_cost += (
                ADDON_PRICES[addon]
                * booking.days
            )

            workspace = AddonDecorator(
                workspace,
                addon.title(),
                ADDON_PRICES[addon]
            )

    return {

        "base_price":
        space.daily_rate * booking.days,

        "addons_total":
        total_addon_cost,

        "total_price":
        workspace.get_cost(),

        "savings":
        (
            space.daily_rate
            * booking.days
        )
        -
        (
            workspace.get_cost()
            - total_addon_cost
        ),
    }


@app.post("/book")
def create_booking(
    booking: BookingRequest
):

    space = next(
        (
            s for s in SPACES
            if s.id == booking.space_id
        ),
        None
    )

    if not space:

        raise HTTPException(
            status_code=404,
            detail="Space not found"
        )

    template = StandardBooking()

    template.process_booking(
        space,
        booking.days,
        booking.addons
    )

    booking_state = BookingContext()

    booking_state.confirm_booking()

    facade = BookingFacade()

    result = facade.create_booking(
        space,
        booking.days,
        booking.plan,
        booking.addons
    )

    payment_api = ExternalPaymentAPI()

    adapter = PaymentAdapter(
        payment_api
    )

    payment_result = adapter.pay(
        result["total_cost"]
    )

    return {
        "status":
        payment_result["status"],

        "transaction_id":
        result["booking_id"],

        "amount":
        payment_result["amount"],

        "currency":
        payment_result["currency"],

        "booking_state":
        booking_state.get_state()
    }


if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )