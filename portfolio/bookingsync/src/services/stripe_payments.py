"""Stripe payment service"""

from typing import Optional
import logging

from ..config import settings

logger = logging.getLogger(__name__)


class StripePaymentService:
    """Stripe payment integration"""

    def __init__(self):
        self.demo_mode = settings.demo_mode

        if not self.demo_mode:
            try:
                import stripe
                stripe.api_key = settings.stripe_api_key
                self.stripe = stripe
            except Exception as e:
                logger.error(f"Failed to initialize Stripe: {e}")
                self.demo_mode = True

    async def create_payment_intent(
        self,
        amount_cents: int,
        customer_email: str,
        description: str,
        metadata: Optional[dict] = None
    ) -> Optional[str]:
        """Create Stripe payment intent"""
        if self.demo_mode:
            logger.info(
                f"[DEMO] Would create payment intent: "
                f"${amount_cents/100:.2f} for {customer_email}"
            )
            return f"demo_pi_{amount_cents}"

        try:
            intent = self.stripe.PaymentIntent.create(
                amount=amount_cents,
                currency='usd',
                receipt_email=customer_email,
                description=description,
                metadata=metadata or {}
            )

            logger.info(f"Payment intent created: {intent.id}")
            return intent.id

        except Exception as e:
            logger.error(f"Error creating payment intent: {e}")
            return None

    async def confirm_payment_intent(
        self,
        payment_intent_id: str
    ) -> bool:
        """Confirm payment intent"""
        if self.demo_mode:
            logger.info(f"[DEMO] Would confirm payment intent: {payment_intent_id}")
            return True

        try:
            intent = self.stripe.PaymentIntent.retrieve(payment_intent_id)

            if intent.status == 'succeeded':
                return True

            return False

        except Exception as e:
            logger.error(f"Error confirming payment: {e}")
            return False

    async def create_deposit_payment(
        self,
        deposit_cents: int,
        total_cents: int,
        customer_email: str,
        appointment_id: str
    ) -> Optional[str]:
        """Create payment intent for deposit"""
        metadata = {
            'appointment_id': appointment_id,
            'payment_type': 'deposit',
            'total_amount': total_cents,
            'deposit_amount': deposit_cents
        }

        return await self.create_payment_intent(
            amount_cents=deposit_cents,
            customer_email=customer_email,
            description=f"Deposit for appointment {appointment_id}",
            metadata=metadata
        )

    async def create_full_payment(
        self,
        amount_cents: int,
        customer_email: str,
        appointment_id: str
    ) -> Optional[str]:
        """Create payment intent for full payment"""
        metadata = {
            'appointment_id': appointment_id,
            'payment_type': 'full'
        }

        return await self.create_payment_intent(
            amount_cents=amount_cents,
            customer_email=customer_email,
            description=f"Payment for appointment {appointment_id}",
            metadata=metadata
        )

    async def refund_payment(
        self,
        payment_intent_id: str,
        amount_cents: Optional[int] = None
    ) -> bool:
        """Refund payment"""
        if self.demo_mode:
            logger.info(f"[DEMO] Would refund payment: {payment_intent_id}")
            return True

        try:
            refund_data = {'payment_intent': payment_intent_id}
            if amount_cents:
                refund_data['amount'] = amount_cents

            refund = self.stripe.Refund.create(**refund_data)

            logger.info(f"Refund created: {refund.id}")
            return True

        except Exception as e:
            logger.error(f"Error creating refund: {e}")
            return False


# Singleton instance
stripe_service = StripePaymentService()
