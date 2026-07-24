from sqlalchemy import Column, String, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import ARRAY
from app.core.database import Base
from .schemas import CoverageLevel

class TechniqueModel(Base):
    __tablename__ = "mitre_techniques"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    
    tactics = Column(ARRAY(String), default=[])
    data_sources = Column(ARRAY(String), default=[])
    mitigations = Column(ARRAY(String), default=[])
    
    coverage = Column(SQLEnum(CoverageLevel, name="coverage_level_enum"), default=CoverageLevel.NONE)
    linked_sigma_rules = Column(ARRAY(String), default=[])
    linked_wazuh_rules = Column(ARRAY(String), default=[])
