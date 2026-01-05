#!/usr/bin/env python3
"""CLI entry point for the post publisher background service."""

import asyncio
import argparse
import logging
import sys
import os

# Add the app directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.post_publisher import PostPublisher


def main():
    parser = argparse.ArgumentParser(description="DevScout Post Publisher")
    parser.add_argument(
        "--once",
        action="store_true",
        help="Run once and exit (for cron jobs)"
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=60,
        help="Seconds between checks (default: 60)"
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug logging"
    )
    args = parser.parse_args()

    # Configure logging
    log_level = logging.DEBUG if args.debug else logging.INFO
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)]
    )

    logger = logging.getLogger(__name__)
    logger.info("Starting DevScout Post Publisher")

    publisher = PostPublisher()

    async def run():
        if args.once:
            stats = await publisher.run_once()
            logger.info(f"Run complete: {stats}")
            await publisher.cleanup()
            return stats
        else:
            await publisher.run_forever(interval_seconds=args.interval)

    try:
        result = asyncio.run(run())
        if args.once:
            # Exit with error if any posts failed
            if result.get("failed", 0) > 0:
                sys.exit(1)
    except KeyboardInterrupt:
        logger.info("Shutting down...")
    except Exception as e:
        logger.exception(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
