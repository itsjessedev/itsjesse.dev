"""Field mapping service."""

import re
from difflib import SequenceMatcher
from typing import List, Optional
from ..models.mapping import FieldMapping, MappingRule, TransformationType


class FieldMapper:
    """Intelligent field mapping between source and target schemas."""

    def auto_map_fields(
        self,
        source_fields: List[str],
        target_fields: List[str],
        case_sensitive: bool = False,
        fuzzy_threshold: float = 0.8,
    ) -> FieldMapping:
        """
        Automatically map fields using various strategies.

        Args:
            source_fields: List of source field names
            target_fields: List of target field names
            case_sensitive: Whether to perform case-sensitive matching
            fuzzy_threshold: Minimum similarity score for fuzzy matching (0-1)

        Returns:
            FieldMapping with auto-generated mappings
        """
        mappings: List[MappingRule] = []
        mapped_targets = set()

        for source_field in source_fields:
            # Try exact match first
            target = self._find_exact_match(
                source_field, target_fields, case_sensitive
            )

            # Try fuzzy match if no exact match
            if not target:
                target = self._find_fuzzy_match(
                    source_field, target_fields, fuzzy_threshold
                )

            # Try semantic match (common patterns)
            if not target:
                target = self._find_semantic_match(source_field, target_fields)

            if target and target not in mapped_targets:
                mappings.append(
                    MappingRule(
                        source_field=source_field,
                        target_field=target,
                        transformation=TransformationType.DIRECT,
                    )
                )
                mapped_targets.add(target)

        # Identify unmapped fields
        mapped_sources = {m.source_field for m in mappings}
        unmapped_source = [f for f in source_fields if f not in mapped_sources]
        unmapped_target = [f for f in target_fields if f not in mapped_targets]

        return FieldMapping(
            migration_id="",  # Will be set by orchestrator
            source_fields=source_fields,
            target_fields=target_fields,
            mappings=mappings,
            unmapped_source_fields=unmapped_source,
            unmapped_target_fields=unmapped_target,
            auto_map_enabled=True,
            case_sensitive=case_sensitive,
            fuzzy_match_threshold=fuzzy_threshold,
        )

    def _find_exact_match(
        self, source: str, targets: List[str], case_sensitive: bool
    ) -> Optional[str]:
        """Find exact match in target fields."""
        source_cmp = source if case_sensitive else source.lower()

        for target in targets:
            target_cmp = target if case_sensitive else target.lower()
            if source_cmp == target_cmp:
                return target

        return None

    def _find_fuzzy_match(
        self, source: str, targets: List[str], threshold: float
    ) -> Optional[str]:
        """Find fuzzy match using string similarity."""
        best_match = None
        best_score = 0.0

        source_normalized = self._normalize_field_name(source)

        for target in targets:
            target_normalized = self._normalize_field_name(target)

            # Calculate similarity
            score = SequenceMatcher(
                None, source_normalized, target_normalized
            ).ratio()

            if score > best_score and score >= threshold:
                best_score = score
                best_match = target

        return best_match

    def _find_semantic_match(
        self, source: str, targets: List[str]
    ) -> Optional[str]:
        """Find semantic match using common field name patterns."""
        # Common field name mappings
        semantic_patterns = {
            # ID fields
            r".*id$": ["id", "identifier", "key"],
            r"^id": ["id", "identifier", "key"],

            # Name fields
            r".*name": ["name", "title", "label"],
            r"first.*name": ["first_name", "firstname", "fname"],
            r"last.*name": ["last_name", "lastname", "lname"],

            # Email/Phone
            r".*email": ["email", "email_address", "mail"],
            r".*phone": ["phone", "telephone", "phone_number"],

            # Address fields
            r".*address": ["address", "street", "location"],
            r".*city": ["city", "town"],
            r".*state": ["state", "province", "region"],
            r".*zip": ["zip", "zipcode", "postal_code", "postcode"],

            # Date fields
            r".*date": ["date", "timestamp", "created_at", "updated_at"],
            r"created.*": ["created_at", "creation_date", "date_created"],
            r"updated.*": ["updated_at", "modification_date", "date_modified"],
        }

        source_lower = source.lower()

        for pattern, candidates in semantic_patterns.items():
            if re.match(pattern, source_lower):
                for candidate in candidates:
                    # Check if any target field contains this candidate
                    for target in targets:
                        if candidate in target.lower():
                            return target

        return None

    def _normalize_field_name(self, field: str) -> str:
        """Normalize field name for comparison."""
        # Remove common prefixes/suffixes
        normalized = re.sub(r"^(tbl|fld|col)_?", "", field, flags=re.IGNORECASE)
        normalized = re.sub(r"_?(id|name|value)$", "", normalized, flags=re.IGNORECASE)

        # Replace separators with spaces
        normalized = re.sub(r"[_\-\.]", " ", normalized)

        # Remove extra whitespace
        normalized = " ".join(normalized.split())

        return normalized.lower()
