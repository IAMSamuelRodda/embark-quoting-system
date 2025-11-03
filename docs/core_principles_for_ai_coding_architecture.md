# Core Principles for AI Coding Architecture

## Principle 1

category: The Big Three
concept: Context management
importance: paramount
quote: If you manage your context, you manage your results
description: Context management is the foundation of effective AI coding

## Principle 2

category: The Big Three
concept: Token efficiency
evaluation_lens: All architectures must be evaluated through token efficiency
description: Token efficiency determines cost and effectiveness of AI coding

## Principle 3

category: The Big Three
concept: File pathways
requirement: Clear pathways to collections of files, not just individual files
description: AI coding tools need organized access to related files

## Principle 4

category: Key Design Philosophy
concept: AI readability priority
principle: AI readability ≥ Human readability
paradigm_shift: From human-first to AI-first code organization
description: The paradigm is shifting to prioritize AI understanding

## Principle 5

category: Key Design Philosophy
concept: Optimal design for AI tools
tools: Cursor, Zed, Claude Code, Aider, Windsurf
focus: Design codebases to be optimal for AI coding tools
description: Structure code specifically for AI tool consumption

## Principle 6

category: Key Design Philosophy
concept: Context architecture priority
principle: Tools will change and evolve; what matters is how you architect systems of context
description: Focus on context architecture rather than specific tools

---

# Architecture Comparison

## Architecture 1

name: Atomic Composable Architecture
structure: Atoms → Molecules → Organisms
structure_extended: Can extend to Membranes → Ecosystems
recommendation_level: Conditional

### Pros 1

feature: High reusability
benefit: Components can be reused across the codebase

### Pros 2

feature: Very clear separation of concerns
benefit: Each component has distinct responsibility

### Pros 3

feature: Easy for AI tools to understand
method: With brief descriptions
benefit: Simple pattern comprehension for AI

### Pros 4

feature: Excellent for testing
benefit: Fine-grained functionality isolation
testing_quality: High

### Pros 5

feature: Scales well
method: By adding more atomic units
scalability: High

### Pros 6

feature: Simple pattern
benefit: Easy for AI tools to comprehend

### Cons 1

problem: New Feature Modification Chain Problem
description: Changing a lower-level atom requires updating all higher-level compositions
impact: High maintenance burden

### Cons 2

problem: Requires discipline
requirement: Maintain proper composable chains
risk: Architecture degradation without discipline

### Cons 3

problem: Context explosion
description: AI tools need more context in their window when modifying lower levels
impact: Increased token consumption

### Cons 4

problem: Back-testing burden
description: Increases with composition depth
impact: More testing required for deeper hierarchies

## Architecture 2

name: Layered Architecture
popularity: Most Popular
structure: Interface → API → Business Logic → Utilities
structure_description: Arbitrary layers
recommendation_level: Avoid

### Pros 1

feature: Clear separation of concerns
benefit: Organized by technical responsibility

### Pros 2

feature: Easy to understand responsibilities
benefit: Clear boundaries between layers

### Pros 3

feature: Dynamic and scales well
scalability: Good

### Pros 4

feature: Most widely established pattern
adoption: Industry standard

### Cons 1

problem: AI tools must operate across all layers
description: Imports span multiple directories
impact: Poor context efficiency

### Cons 2

problem: Poor context locality
description: Related functionality scattered across layers
impact: Difficult for AI to locate related code

### Cons 3

problem: Forces AI coding tools to read everything
description: Must search to find what they need
impact: Excessive context loading

### Cons 4

problem: Leads to excessive token consumption
description: Just searching, not creating value
cost_impact: High

## Architecture 3

name: Vertical Slice Architecture
recommendation_level: RECOMMENDED FOR AI AGENTS
recommended_for: AI Agents
structure: Feature-based slices containing everything needed for that feature
priority: ⭐

### Pros 1

feature: Everything for a feature lives in one place
benefit: Massive win for context management
context_efficiency: Maximum

### Pros 2

feature: Extremely token-efficient
benefit: AI tools don't waste tokens searching
cost_savings: High

### Pros 3

feature: Self-contained features
benefit: Each slice has all dependencies
independence: Complete

### Pros 4

feature: Easy versioning
method: Copy entire slice for V2
versioning_simplicity: High

### Pros 5

feature: Optimal for building AI agents
benefit: Each agent can be its own vertical slice
agent_architecture: Ideal

### Pros 6

feature: Quick iteration and modification
development_speed: Fast

### Pros 7

feature: Clear boundaries
benefit: AI tools understand what belongs where
clarity: High

### Cons 1

problem: Lower code reusability
comparison: Compared to atomic architecture
tradeoff: Reusability for locality

### Cons 2

problem: Can lead to code duplication
description: Across slices
maintenance_concern: Moderate

### Cons 3

problem: Requires discipline
requirement: Keep slices truly independent
risk: Cross-slice dependencies

### Why It Wins 1

principle: Agent = Feature = Vertical Slice
alignment: Perfect mapping

### Why It Wins 2

benefit: All context needed for an agent lives under that agent's directory
context_management: Optimal

### Why It Wins 3

benefit: No need to traverse multiple directories
navigation_simplicity: Maximum

### Why It Wins 4

benefit: Easy to version agents
example: Agent V1, Agent V2
versioning: Simplified

### Why It Wins 5

benefit: Can switch LLM providers per agent easily
flexibility: High

## Architecture 4

name: Single File Agents
recommendation_level: HIGHLY RECOMMENDED FOR AI AGENTS
recommended_for: AI Agents
structure: One file per agent
file_size: 700+ lines is acceptable here, not an anti-pattern
priority: ⭐

### Pros 1

feature: Ultimate context simplicity
benefit: Entire agent in one file
simplicity: Maximum

### Pros 2

feature: Zero navigation overhead
benefit: Just reference the file
navigation: None required

### Pros 3

feature: Maximum prompt efficiency
example: read this file and modify X
efficiency: Optimal

### Pros 4

feature: Self-contained, complete agent context
completeness: Total

### Pros 5

feature: Easy updates and iterations
development_speed: Very fast

### Pros 6

feature: No dependency hunting
search_required: None

### Cons 1

problem: Large files
size: 700+ lines
note: But this is acceptable in this architecture

### Cons 2

problem: Goes against traditional conventions
convention: small file principle
paradigm: AI-first vs human-first

### Why This Matters 1

benefit: Open file → Start prompting immediately
time_to_productivity: Instant

### Why This Matters 2

benefit: No need to understand complex directory structures
cognitive_load: Minimal

### Why This Matters 3

benefit: AI coding assistant can update agent with minimal context
context_requirement: Minimal

---

# Prompting Strategies for Effective AI Coding

## Context Management Strategy 1

number: 1
principle: Provide clear pathways to collections of files
guidance: Not scattered information

## Context Management Strategy 2

number: 2
principle: Minimize context window pollution
benefit: Well-organized code means less token waste

## Context Management Strategy 3

number: 3
principle: Use precise file references when prompting
precision: High

## Context Management Strategy 4

number: 4
principle: Bundle related functionality
benefit: AI tools don't need to search

---

# Avoiding Failure Modes

## DON'T 1

anti_pattern: Force AI tools to search through 20+ files
location: In poorly organized directories
impact: High token waste

## DON'T 2

anti_pattern: Use layered architectures
problem: Scatter related code
impact: Poor context locality

## DON'T 3

anti_pattern: Create deep composition chains
problem: Require massive context windows
impact: Context explosion

## DON'T 4

anti_pattern: Organize solely for human readability
problem: Ignores AI navigation needs
paradigm: Human-first only

## DO 1

best_practice: Use vertical slices or single-file agents
use_case: Agent development
benefit: Optimal context management

## DO 2

best_practice: Keep context localized and contained
benefit: Reduced token consumption

## DO 3

best_practice: Provide clear descriptions
structure: For atoms/molecules/organisms if using atomic structure
benefit: AI comprehension

## DO 4

best_practice: Think about token efficiency
scope: In every architectural decision
priority: High

## DO 5

best_practice: Design for both readability AND AI navigation
balance: Human and AI needs
paradigm: Dual optimization

---

# Cost-Effectiveness

## Cost Principle 1

principle: Well-structured code = cost-effective code
chain: Saves tokens = saves money
impact: Direct cost reduction

## Cost Principle 2

problem: AI tools chew up tokens
cause: Looking for stuff in poorly organized codebases
waste_type: Search tokens

## Cost Principle 3

benefit: Organized code saves
savings_1: Time
savings_2: Tokens
savings_3: Money

---

# Specific Recommendations

## For Building AI Agents 1

recommendation: Vertical Slice Architecture
description: Each agent as a feature slice
priority: High

## For Building AI Agents 2

recommendation: Single File Agents
benefit: For ultimate simplicity and context efficiency
priority: Highest

## For Building AI Agents 3

benefit_1: Easy versioning
benefit_2: Quick context switching
benefit_3: Minimal token waste
benefit_4: Self-contained functionality

## For General AI Coding 1

recommendation: Atomic Composable
use_case: When reusability and testing are paramount
priority: Conditional

## For General AI Coding 2

recommendation: Vertical Slice
use_case: When feature independence and context locality matter most
priority: High

## For General AI Coding 3

recommendation: Avoid Layered
exception: Unless you have specific requirements that demand it
default: Not recommended

---

# Critical Insights

## Current State

timeframe: Short-Medium Term
insight_1: Yes, architecture matters significantly
insight_2: Good codebase architecture = easier context management
insight_3: Precise context management is crucial for AI coding success

## Future State

trend: As LLMs evolve, structure may matter less
current_reality: Currently, context management is the name of the game
strategy: Better to be ahead of the curve now

## The Paradigm Shift

trend_1: Most code will be written by AI tools moving forward
mindset: Think about codebases from the AI tool's perspective
timeline: 2025 is pivotal year for adopting AI-first architecture
transformation: Engineers must flip from human-first to AI-first organization

---

# Action Items for Effective Prompting

## Action Item 1

number: 1
action: Choose vertical slice or single-file for agents
benefit: Maximize context locality

## Action Item 2

number: 2
action: Document clear boundaries
benefit: Help AI understand where things belong

## Action Item 3

number: 3
action: Keep related code together
benefit: Minimize cross-directory imports for features

## Action Item 4

number: 4
action: Think token-first
principle: Every architectural decision should consider token efficiency

## Action Item 5

number: 5
action: Test context efficiency
question: Can you reference one directory/file and start working?

## Action Item 6

number: 6
action: Version thoughtfully
benefit: Make it easy to copy and iterate entire features/agents

---

# Key Takeaway

principle: Managing context = Managing results
goal: Design your architecture so AI tools spend tokens creating value, not searching for files
priority: Critical