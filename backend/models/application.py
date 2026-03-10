from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship, backref
from sqlalchemy.sql import func
import enum
from db.database import Base

class ApplicationStatus(str, enum.Enum):
    APPLIED = "Applied"
    INTERVIEWING = "Interviewing"
    OFFERED = "Offered"
    REJECTED = "Rejected"

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True)
    
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.APPLIED, nullable=False)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="applications")
    job = relationship("Job", backref=backref("applications", cascade="all, delete-orphan", passive_deletes=True))
    resume = relationship("Resume", backref=backref("applications", passive_deletes=True))
