from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, ForeignKey, DateTime
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Account(Base):
    __tablename__ = "accounts"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    industry = Column(String, nullable=False)
    stage = Column(String, nullable=False)  # e.g., Discovery, Qualification, Proposal, Negotiation, Closed Won, Closed Lost
    value = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    contacts = relationship("Contact", back_populates="account", cascade="all, delete-orphan")
    interactions = relationship("Interaction", back_populates="account", cascade="all, delete-orphan", order_by="desc(Interaction.date)")
    outcomes = relationship("Outcome", back_populates="account", cascade="all, delete-orphan")
    agent_runs = relationship("AgentRun", back_populates="account", cascade="all, delete-orphan")


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(String, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    notes = Column(Text, nullable=True)

    account = relationship("Account", back_populates="contacts")


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(String, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String, nullable=False)  # call, email, note, meeting
    date = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    raw_text = Column(Text, nullable=False)
    extracted_json = Column(Text, nullable=True)  # JSON string of facts
    retained = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    account = relationship("Account", back_populates="interactions")


class Outcome(Base):
    __tablename__ = "outcomes"

    id = Column(String, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    result = Column(String, nullable=False)  # won, lost
    reason = Column(Text, nullable=False)
    tactics = Column(Text, nullable=True)
    date = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    account = relationship("Account", back_populates="outcomes")


class AgentRun(Base):
    __tablename__ = "agent_runs"

    id = Column(String, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True, index=True)
    kind = Column(String, nullable=False)  # brief, followup, coach, chat, compare
    memory_on = Column(Boolean, nullable=False, default=True)
    recalled_ids = Column(Text, nullable=True)  # JSON array of memory IDs or sources
    output = Column(Text, nullable=False)
    latency_ms = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    account = relationship("Account", back_populates="agent_runs")
