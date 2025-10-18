"""Custom vulnerability type model for user-defined types."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class CustomVulnerabilityType(Base):
    """User-defined custom vulnerability types with metadata."""

    __tablename__ = "custom_vulnerability_types"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Core fields
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    # Metadata
    icon: Mapped[str] = mapped_column(String(50), nullable=False, default="Circle")
    color: Mapped[str] = mapped_column(String(50), nullable=False, default="text-gray-600")
    description: Mapped[str] = mapped_column(Text, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<CustomVulnerabilityType {self.name} ({self.category})>"
