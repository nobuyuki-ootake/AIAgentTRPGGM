# Taskmaster AI Development Workflow

## Overview

This project uses Taskmaster AI for structured task management and AI-driven development. The AI assistant should follow these guidelines when working with tasks.

## Task Management Commands

### Initialization and Setup

- Use `task-master init` to initialize new projects
- Parse PRD with `task-master parse-prd .taskmaster/docs/prd.txt`
- Generate task files with `task-master generate`

### Task Discovery and Planning

- List all tasks: `task-master list`
- Show next task: `task-master next`
- View specific task: `task-master show <id>`
- Analyze complexity: `task-master analyze-complexity`

### Task Implementation

- Set task status: `task-master set-status --id=<id> --status=<status>`
- Expand complex tasks: `task-master expand --id=<id> --num=<number>`
- Update tasks: `task-master update --from=<id> --prompt="<context>"`

### Task Status Values

- `pending`: Task is ready to be worked on
- `in-progress`: Task is currently being worked on
- `done`: Task has been completed
- `deferred`: Task has been postponed

## AI Assistant Guidelines

### When Starting Work

1. Always check current task status with `task-master list`
2. Identify the next task to work on with `task-master next`
3. Review task details with `task-master show <id>`
4. Mark task as in-progress before starting implementation

### During Implementation

1. Follow the task's detailed requirements and acceptance criteria
2. Consider dependencies and ensure prerequisite tasks are completed
3. Implement according to the project's coding standards and architecture
4. Create appropriate tests based on the task's test strategy

### When Completing Tasks

1. Verify implementation meets all acceptance criteria
2. Run tests and ensure they pass
3. Mark task as done with `task-master set-status --id=<id> --status=done`
4. Generate updated task files if needed

### Handling Complex Tasks

1. Use `task-master analyze-complexity` to identify complex tasks
2. Break down complex tasks with `task-master expand --id=<id>`
3. Consider using research-backed expansion with `--research` flag
4. Work on subtasks systematically

### Managing Changes

1. If implementation approach changes, update future tasks with `task-master update`
2. Provide clear context about the changes in the prompt
3. Regenerate task files to reflect updates

## Project Structure

- `.taskmaster/`: Configuration and templates
- `.taskmaster/docs/prd.txt`: Product Requirements Document
- `.taskmaster/config.json`: Taskmaster configuration
- `tasks/`: Individual task files
- `scripts/`: Legacy location for PRD (use .taskmaster/docs/ for new projects)

## Integration with Development Workflow

- Tasks should align with the project's monorepo structure (apps/, packages/)
- Follow the established coding standards and type definitions
- Respect the project's architecture patterns and conventions
- Ensure tasks contribute to the overall project goals defined in the PRD

## Best Practices

1. Always start with a detailed PRD for better task generation
2. Review and validate generated tasks before implementation
3. Keep task dependencies logical and manageable
4. Use descriptive commit messages that reference task IDs
5. Regularly update task status to maintain project visibility
6. Break down large tasks into manageable subtasks
7. Use the complexity analysis feature to optimize task planning
