from sqlalchemy import Column, String, Boolean, Enum as SQLEnum
from app.core.database import VariantArray as ARRAY
from app.core.database import Base
from .schemas import AssetType, Environment, Criticality

class AssetModel(Base):
    __tablename__ = "assets"

    id = Column(String, primary_key=True, index=True)
    hostname = Column(String, index=True)
    ip_address = Column(String, index=True)
    os_name = Column(String)
    
    asset_type = Column(SQLEnum(AssetType, name="asset_type_enum"), nullable=False)
    environment = Column(SQLEnum(Environment, name="environment_enum"), nullable=False)
    criticality = Column(SQLEnum(Criticality, name="criticality_enum"), nullable=False)
    
    owner = Column(String)
    tags = Column(ARRAY(String), default=[])
    
    has_wazuh_agent = Column(Boolean, default=False)
    protected_by_waf = Column(Boolean, default=False)
    is_internet_facing = Column(Boolean, default=False)
