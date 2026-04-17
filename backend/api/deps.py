from core.database import get_db
from sqlalchemy.orm import Session
from fastapi import Depends

DatabaseDep = Depends(get_db)
