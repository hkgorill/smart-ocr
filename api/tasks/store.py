"""비동기 배치 작업 결과를 보관하는 인메모리 태스크 스토어."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Literal


@dataclass
class Task:
    id: str
    status: Literal["pending", "processing", "done", "failed"] = "pending"
    created_at: datetime = field(default_factory=datetime.now)
    result: Any = None
    error: str | None = None


class TaskStore:
    def __init__(self) -> None:
        self._tasks: dict[str, Task] = {}

    def create(self) -> Task:
        task = Task(id=str(uuid.uuid4()))
        self._tasks[task.id] = task
        return task

    def get(self, task_id: str) -> Task | None:
        return self._tasks.get(task_id)

    def update(self, task_id: str, **kwargs: Any) -> None:
        if task := self._tasks.get(task_id):
            for key, value in kwargs.items():
                setattr(task, key, value)

    def clear(self) -> None:
        """테스트용 초기화."""
        self._tasks.clear()


# 앱 전역 싱글턴 — 테스트에서 monkeypatch로 교체 가능
task_store = TaskStore()
