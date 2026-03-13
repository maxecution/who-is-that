# Software Requirements Specification (SRS)

## Pokémon Silhouette Guessing Game

---

# 1. System Overview

## 1.1 Purpose

The system is a browser-based guessing game inspired by the “Who’s That Pokémon?” mechanic. Users are presented with the silhouette of a Pokémon and must correctly guess its name using a text input with autocomplete suggestions.

The system demonstrates:

- REST API consumption from PokeAPI
- response filtering via a backend API
- HTTP caching via axios-cache-interceptor
- TypeScript-based full-stack architecture
- state persistence via localStorage
- mobile-first UI design

The application retrieves Pokémon data using the pokenode-ts client library.

---

# 2. System Architecture

## 2.1 High-Level Architecture

```
User Browser
      │
      │ HTTP
      ▼
React + Vite Frontend
(TypeScript)
      │
      │ REST API
      ▼
Fastify Backend
(TypeScript)
      │
      │ REST API
      ▼
PokeAPI
```

### Responsibilities

| Layer        | Responsibility                              |
| ------------ | ------------------------------------------- |
| Frontend     | Game logic, UI rendering, state persistence |
| Backend      | REST proxy, response filtering, caching     |
| External API | Pokémon data provider                       |

The backend remains **stateless**. All gameplay state is stored client-side.

---

# 3. Technology Stack

## Frontend

- React
- Vite
- TypeScript
- CSS Modules & Tailwind
- localStorage

## Backend

- Node.js
- Fastify
- TypeScript
- pokenode-ts
- axios-cache-interceptor

## External Data

Primary data source:

- PokeAPI

Sprites and cries served via GitHub CDN used by the API.

---

# 4. Functional Requirements

## 4.1 Game Mechanics

### Initial Game State

Default values:

```
Lives: 6
Score: 0
Enabled Generations: 1–9
Sound: Disabled
```

A random Pokémon is selected from the enabled generations.

---

## 4.2 Pokémon Selection

Only **base national dex Pokémon** are included.

Dex range:

```
1 – 1025
```

Generation ranges:

| Generation | Dex Range |
| ---------- | --------- |
| 1          | 1–151     |
| 2          | 152–251   |
| 3          | 252–386   |
| 4          | 387–493   |
| 5          | 494–649   |
| 6          | 650–721   |
| 7          | 722–809   |
| 8          | 810–905   |
| 9          | 906–1025  |

Random selection must be **uniform across all enabled generations**.

---

# 5. Gameplay State Management

Game state is persisted in **localStorage**.

Example structure:

```json
{
  "currentPokemonId": 25,
  "lives": 5,
  "score": 3,
  "highscore": 10,
  "remainingPool": [1, 2, 3],
  "incorrectPool": [12, 44],
  "enabledGenerations": [1, 2, 3, 4, 5, 6, 7, 8, 9],
  "soundEnabled": false
}
```

### Pools

The game maintains two Pokémon pools:

**remainingPool**

Pokémon not yet correctly guessed.

**incorrectPool**

Pokémon guessed incorrectly or skipped.

### Pool Behaviour

```
Correct guess → removed permanently
Incorrect guess → moved to incorrectPool
Skip → moved to incorrectPool
```

When `remainingPool` becomes empty:

```
remainingPool = incorrectPool
incorrectPool = []
```

---

# 6. Game Completion Conditions

The game ends when **either** condition occurs:

1. Player loses all lives
2. All Pokémon are correctly guessed

High score persists across sessions.

---

# 7. Guess Validation

User guesses are normalised before comparison.

Normalization pipeline:

```
lowercase
remove diacritics
replace '-' with space
remove apostrophes
trim whitespace
```

Example accepted inputs:

| Pokémon    | Accepted Inputs |
| ---------- | --------------- |
| mr-mime    | mr mime         |
| farfetch'd | farfetchd       |
| type-null  | type null       |

No fuzzy matching is implemented.

Validation is **case-insensitive exact matching after normalisation**.

---

# 8. Silhouette Reveal Mechanic

The silhouette is revealed progressively based on **correct prefix characters**.

Example:

Target name:

```
pikachu
```

User input:

```
pikts
```

Correct prefix:

```
pik
```

Reveal ratio:

```
correctPrefixLength / totalNameLength
```

Example:

```
3 / 7 = 42.8%
```

---

## Implementation Approach

The sprite image is rendered with a **CSS mask overlay**.

Base state:

```
filter: brightness(0)
```

Mask height is dynamically adjusted according to reveal ratio.

Reveal direction:

```
bottom → top
```

---

# 9. User Interface Requirements

## Layout

Mobile-first layout:

```
Lives: ● ● ● ● ● ●    Score: X

[ Pokémon silhouette ]

Guess the Pokémon

[ Text Input ]

[ Submit ]   [ Skip ]

[ Sound Toggle ] [ Play Sound ]

[ Reset Game ]
```

---

# 10. Lives Display

Lives are displayed as Pokéball icons using the sprite:

```
https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png
```

State representation:

| Icon   | Meaning        |
| ------ | -------------- |
| Filled | Life remaining |
| Empty  | Life lost      |

---

# 11. Autocomplete System

The input field includes a **custom autocomplete component**.

Data source:

```
GET /pokemon-index
```

Returned dataset:

```
~1025 Pokémon names
```

Matching behaviour:

```
prefix match only
```

Example:

```
pi → pidgey, pidgeotto, pikachu..
```

Suggestions are displayed in **alphabetical order**.

---

## Submit Triggers

A guess submission occurs when:

- user presses **Enter**
- user clicks **Submit**
- user selects an **autocomplete suggestion**

---

# 12. Sound System

Pokémon cries use the URL returned from the PokeAPI response:

```
response.cries.latest
```

Default state:

```
soundEnabled = false
```

Behaviour when sound is enabled:

1. Current Pokémon cry plays immediately.
2. Each newly loaded Pokémon cry plays automatically.

Manual playback:

```
[Play] button
```

The Play button:

- plays the current Pokémon cry once
- does not toggle the sound setting

---

# 13. Backend API Specification

The backend acts as a **filtered proxy** to PokeAPI.

## Endpoint: Pokémon Index

```
GET /pokemon-index
```

Response:

```json
[
  { "id": 1, "name": "bulbasaur" },
  { "id": 2, "name": "ivysaur" }
]
```

Used by frontend autocomplete.

---

## Endpoint: Pokémon Details

```
GET /pokemon/:id
```

Response:

```json
{
  "id": 25,
  "name": "pikachu",
  "sprite": "https://raw.githubusercontent.com/.../25.png",
  "cry": "https://raw.githubusercontent.com/.../25.ogg"
}
```

Fields are filtered from the full PokeAPI response.

---

# 14. Backend Caching Strategy

Caching is handled by **axios-cache-interceptor** integrated with **pokenode-ts**.

Cache characteristics:

| Property | Value                       |
| -------- | --------------------------- |
| Location | In-memory                   |
| TTL      | Configurable (24h to start) |
| Scope    | Entire API process          |

Cache flow:

```
Fastify route
     ↓
pokenode-ts client
     ↓
axios-cache-interceptor
     ↓
cache hit → return cached
cache miss → call PokeAPI
```

---

# 15. Accessibility Requirements

The application must support accessibility best practices.

### Input

- labelled text input
- screen reader accessible instructions

### Autocomplete

- ARIA roles (`listbox`, `option`)
- keyboard navigation
- highlight active option

### Keyboard Support

All controls must be operable via keyboard:

- submit
- skip
- toggle sound
- play sound
- reset

### Visual Accessibility

- sufficient contrast between silhouette and background
- focus indicators for interactive elements

---

# 16. Deployment Architecture

Recommended deployment:

Frontend:

```
React + Vite
Static hosting
(Render / Vercel)
```

Backend:

```
Node + Fastify
(Render Web Service)
```

Runtime flow:

```
Browser
   ↓
Frontend
   ↓
Fastify API
   ↓
PokeAPI
```

---

# 17. Non-Functional Requirements

| Category        | Requirement                                   |
| --------------- | --------------------------------------------- |
| Performance     | Pokémon load under 500ms when cached          |
| Scalability     | Stateless backend allows horizontal scaling   |
| Reliability     | Cached API reduces dependency on external API |
| Maintainability | Full TypeScript typing across stack           |
| Security        | Backend sanitizes all API inputs              |

---

# 18. Future Extension Points

The architecture allows later addition of:

- hint system
- user accounts
- leaderboards
- multiplayer mode

Because the backend is already structured as an API proxy.
