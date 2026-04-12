import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Order, OrderHistory
from services.order_service import OrderService
from core.schemas import OrderCreate, OrderItemCreate
from core.enums import ActionEnum, PaymentEnum

engine = create_engine("sqlite:///gwsh.db")
SessionLocal = sessionmaker(bind=engine)

def run_test():
    session = SessionLocal()
    order_service = OrderService(session)
    
    data = OrderCreate(
        cashier_id=1,
        branch_id=1,
        table_id=None,
        total_amount=10.0,
        action=ActionEnum.CREATE,
        payment_method=PaymentEnum.CASH,
        items=[]
    )
    
    order1 = order_service.create(data)
    print("Order 1 created:", order1.id)
    order_service.checkout(order1.id, 1, PaymentEnum.CASH)
    print("Order 1 checked out")
    
    order2 = order_service.create(data)
    print("Order 2 created:", order2.id)
    order_service.checkout(order2.id, 1, PaymentEnum.CASH)
    print("Order 2 checked out")
    
    history1 = order_service.get_order_history(order1.id)
    print(f"\nHistory for order {order1.id}:")
    for h in history1:
        print(f" - {h.id}: Action={h.action}, OrderID={h.order_id}")
        
    history2 = order_service.get_order_history(order2.id)
    print(f"\nHistory for order {order2.id}:")
    for h in history2:
        print(f" - {h.id}: Action={h.action}, OrderID={h.order_id}")
        
    session.close()

if __name__ == "__main__":
    run_test()
