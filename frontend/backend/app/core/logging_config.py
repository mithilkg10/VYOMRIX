import logging
import json
import sys
from datetime import datetime, timezone
from app.core.config import settings

class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "funcName": record.funcName,
            "lineNo": record.lineno,
            "environment": settings.ENVIRONMENT
        }
        
        if record.exc_info:
            log_data["exc_info"] = self.formatException(record.exc_info)
            
        return json.dumps(log_data)

def setup_logging():
    logger = logging.getLogger()
    
    # Clear existing handlers
    if logger.hasHandlers():
        logger.handlers.clear()
        
    handler = logging.StreamHandler(sys.stdout)
    
    # Use JSON structured logging in production
    if settings.VYOMRIX_RUNTIME != "local":
        handler.setFormatter(JSONFormatter())
    else:
        # Standard format for local development
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)
        
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    
    # Also adjust uvicorn access logs if present
    uvicorn_logger = logging.getLogger("uvicorn.access")
    if uvicorn_logger.hasHandlers():
        uvicorn_logger.handlers.clear()
        uvicorn_logger.addHandler(handler)
