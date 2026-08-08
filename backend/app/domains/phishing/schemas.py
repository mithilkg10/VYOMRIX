from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class PhishingCampaignConfig(BaseModel):
    name: str
    template_id: str
    target_group_id: str
    send_date: datetime

class PhishingCampaignStatus(BaseModel):
    campaign_id: str
    status: str
    emails_sent: int
    links_clicked: int
    credentials_submitted: int
