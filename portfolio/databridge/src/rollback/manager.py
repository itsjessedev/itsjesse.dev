"""Rollback manager for migration recovery."""

import json
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any
import pandas as pd


class RollbackManager:
    """Manage migration rollback capabilities."""

    def __init__(self, backup_dir: str = "./backups"):
        self.backup_dir = Path(backup_dir)
        self.backup_dir.mkdir(exist_ok=True)

    def create_backup(
        self,
        migration_id: str,
        data: pd.DataFrame,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Create backup before migration.

        Args:
            migration_id: Migration identifier
            data: DataFrame to backup
            metadata: Additional metadata to store

        Returns:
            Backup ID
        """
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        backup_id = f"{migration_id}_{timestamp}"

        backup_path = self.backup_dir / backup_id
        backup_path.mkdir(exist_ok=True)

        # Save data
        data_file = backup_path / "data.csv"
        data.to_csv(data_file, index=False)

        # Save metadata
        meta = metadata or {}
        meta.update({
            "migration_id": migration_id,
            "backup_id": backup_id,
            "timestamp": timestamp,
            "record_count": len(data),
            "columns": list(data.columns),
        })

        meta_file = backup_path / "metadata.json"
        with open(meta_file, "w") as f:
            json.dump(meta, f, indent=2)

        return backup_id

    def list_backups(self, migration_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        List available backups.

        Args:
            migration_id: Optional filter by migration ID

        Returns:
            List of backup metadata
        """
        backups = []

        for backup_path in self.backup_dir.iterdir():
            if not backup_path.is_dir():
                continue

            if migration_id and not backup_path.name.startswith(migration_id):
                continue

            meta_file = backup_path / "metadata.json"
            if meta_file.exists():
                with open(meta_file, "r") as f:
                    metadata = json.load(f)
                    backups.append(metadata)

        # Sort by timestamp, newest first
        backups.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return backups

    def restore_backup(self, backup_id: str) -> pd.DataFrame:
        """
        Restore data from backup.

        Args:
            backup_id: Backup identifier

        Returns:
            Restored DataFrame
        """
        backup_path = self.backup_dir / backup_id

        if not backup_path.exists():
            raise ValueError(f"Backup not found: {backup_id}")

        data_file = backup_path / "data.csv"
        if not data_file.exists():
            raise ValueError(f"Backup data file not found: {backup_id}")

        return pd.read_csv(data_file)

    def delete_backup(self, backup_id: str) -> bool:
        """
        Delete a backup.

        Args:
            backup_id: Backup identifier

        Returns:
            True if deleted successfully
        """
        backup_path = self.backup_dir / backup_id

        if not backup_path.exists():
            return False

        shutil.rmtree(backup_path)
        return True

    def rollback_migration(
        self,
        migration_id: str,
        target_connector,
    ) -> Dict[str, Any]:
        """
        Perform full rollback of migration.

        Args:
            migration_id: Migration to rollback
            target_connector: Connector to write rollback data

        Returns:
            Rollback result
        """
        # Find latest backup for migration
        backups = self.list_backups(migration_id)

        if not backups:
            raise ValueError(f"No backups found for migration: {migration_id}")

        latest_backup = backups[0]
        backup_id = latest_backup["backup_id"]

        # Restore data
        restored_data = self.restore_backup(backup_id)

        # Write to target
        success = target_connector.write_data(restored_data)

        return {
            "success": success,
            "backup_id": backup_id,
            "records_restored": len(restored_data),
            "timestamp": datetime.utcnow().isoformat(),
        }

    def cleanup_old_backups(self, days: int = 30) -> int:
        """
        Clean up backups older than specified days.

        Args:
            days: Number of days to keep

        Returns:
            Number of backups deleted
        """
        from datetime import timedelta

        cutoff = datetime.utcnow() - timedelta(days=days)
        deleted = 0

        for backup in self.list_backups():
            backup_time = datetime.strptime(
                backup["timestamp"], "%Y%m%d_%H%M%S"
            )

            if backup_time < cutoff:
                self.delete_backup(backup["backup_id"])
                deleted += 1

        return deleted
