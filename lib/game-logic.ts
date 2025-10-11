import type { Piece, PieceColor } from "@/components/game-board"

export interface Position {
  row: number
  col: number
}

export interface Move {
  from: Position
  to: Position
  capturedPieces?: Position[]
}

export interface GameState {
  pieces: Piece[]
  currentTurn: PieceColor
  winner?: PieceColor
  isDraw?: boolean
}

// Initialize the game board with starting pieces
export function initializeBoard(): Piece[] {
  const pieces: Piece[] = []
  let pieceId = 0

  // Dark pieces (top 3 rows)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        pieces.push({
          id: `piece-${pieceId++}`,
          type: "regular",
          color: "dark",
          position: { row, col },
        })
      }
    }
  }

  // Light pieces (bottom 3 rows)
  for (let row = 5; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        pieces.push({
          id: `piece-${pieceId++}`,
          type: "regular",
          color: "light",
          position: { row, col },
        })
      }
    }
  }

  return pieces
}

// Check if a position is within board bounds
function isValidPosition(pos: Position): boolean {
  return pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8
}

// Get piece at a specific position
function getPieceAt(pieces: Piece[], pos: Position): Piece | undefined {
  return pieces.find((p) => p.position.row === pos.row && p.position.col === pos.col)
}

// Calculate all possible moves for a piece
export function getValidMoves(piece: Piece, pieces: Piece[]): Position[] {
  const moves: Position[] = []
  const captures = getCaptureMovesForPiece(piece, pieces)

  // If there are capture moves available, only return those (forced capture rule)
  if (captures.length > 0) {
    return captures.map((move) => move.to)
  }

  // Regular moves (non-capturing)
  const directions = getDirections(piece)

  for (const dir of directions) {
    const newPos = { row: piece.position.row + dir.row, col: piece.position.col + dir.col }

    if (isValidPosition(newPos) && !getPieceAt(pieces, newPos)) {
      moves.push(newPos)
    }
  }

  return moves
}

// Get movement directions based on piece type and color
function getDirections(piece: Piece): Position[] {
  if (piece.type === "king") {
    // Kings can move in all diagonal directions
    return [
      { row: -1, col: -1 },
      { row: -1, col: 1 },
      { row: 1, col: -1 },
      { row: 1, col: 1 },
    ]
  } else {
    // Regular pieces move forward only
    if (piece.color === "light") {
      return [
        { row: -1, col: -1 },
        { row: -1, col: 1 },
      ]
    } else {
      return [
        { row: 1, col: -1 },
        { row: 1, col: 1 },
      ]
    }
  }
}

// Get all capture directions (including backward for regular pieces)
function getAllCaptureDirections(): Position[] {
  return [
    { row: -1, col: -1 },
    { row: -1, col: 1 },
    { row: 1, col: -1 },
    { row: 1, col: 1 },
  ]
}

// Calculate capture moves for a specific piece
function getCaptureMovesForPiece(piece: Piece, pieces: Piece[]): Move[] {
  const captureMoves: Move[] = []
  const directions = getAllCaptureDirections()

  for (const dir of directions) {
    const jumpOver = { row: piece.position.row + dir.row, col: piece.position.col + dir.col }
    const landOn = { row: piece.position.row + dir.row * 2, col: piece.position.col + dir.col * 2 }

    if (!isValidPosition(jumpOver) || !isValidPosition(landOn)) continue

    const pieceToJump = getPieceAt(pieces, jumpOver)
    const landingPiece = getPieceAt(pieces, landOn)

    // Can capture if there's an opponent piece to jump over and landing square is empty
    if (pieceToJump && pieceToJump.color !== piece.color && !landingPiece) {
      captureMoves.push({
        from: piece.position,
        to: landOn,
        capturedPieces: [jumpOver],
      })
    }
  }

  return captureMoves
}

// Check if any piece of a color has capture moves available
export function hasCaptureMoves(pieces: Piece[], color: PieceColor): boolean {
  return pieces.some((piece) => piece.color === color && getCaptureMovesForPiece(piece, pieces).length > 0)
}

// Get all valid moves for all pieces of a color
export function getAllValidMovesForColor(pieces: Piece[], color: PieceColor): Map<string, Position[]> {
  const movesMap = new Map<string, Position[]>()
  const hasCapturesAvailable = hasCaptureMoves(pieces, color)

  for (const piece of pieces) {
    if (piece.color === color) {
      if (hasCapturesAvailable) {
        // Only return capture moves if any are available
        const captures = getCaptureMovesForPiece(piece, pieces)
        if (captures.length > 0) {
          movesMap.set(
            piece.id,
            captures.map((m) => m.to),
          )
        }
      } else {
        // Return regular moves
        const moves = getValidMoves(piece, pieces)
        if (moves.length > 0) {
          movesMap.set(piece.id, moves)
        }
      }
    }
  }

  return movesMap
}

// Execute a move and return updated pieces
export function executeMove(pieces: Piece[], pieceId: string, newPosition: Position): Piece[] {
  const updatedPieces = [...pieces]
  const pieceIndex = updatedPieces.findIndex((p) => p.id === pieceId)

  if (pieceIndex === -1) return pieces

  const piece = updatedPieces[pieceIndex]
  const oldPosition = piece.position

  // Check if this is a capture move
  const rowDiff = Math.abs(newPosition.row - oldPosition.row)
  const colDiff = Math.abs(newPosition.col - oldPosition.col)

  if (rowDiff === 2 && colDiff === 2) {
    // This is a capture - remove the jumped piece
    const capturedRow = (oldPosition.row + newPosition.row) / 2
    const capturedCol = (oldPosition.col + newPosition.col) / 2
    const capturedIndex = updatedPieces.findIndex(
      (p) => p.position.row === capturedRow && p.position.col === capturedCol,
    )

    if (capturedIndex !== -1) {
      updatedPieces.splice(capturedIndex, 1)
    }
  }

  // Update piece position
  updatedPieces[pieceIndex] = {
    ...piece,
    position: newPosition,
    // Promote to king if reaching opposite end
    type:
      (piece.color === "light" && newPosition.row === 0) || (piece.color === "dark" && newPosition.row === 7)
        ? "king"
        : piece.type,
  }

  return updatedPieces
}

// Check for win condition
export function checkWinCondition(pieces: Piece[], currentTurn: PieceColor): PieceColor | null {
  const lightPieces = pieces.filter((p) => p.color === "light")
  const darkPieces = pieces.filter((p) => p.color === "dark")

  // Win by elimination
  if (lightPieces.length === 0) return "dark"
  if (darkPieces.length === 0) return "light"

  // Win by no valid moves (stalemate = loss for current player)
  const currentPlayerPieces = pieces.filter((p) => p.color === currentTurn)
  const hasValidMoves = currentPlayerPieces.some((piece) => getValidMoves(piece, pieces).length > 0)

  if (!hasValidMoves) {
    return currentTurn === "light" ? "dark" : "light"
  }

  return null
}

// Convert game state to JSON for database storage
export function serializeGameState(pieces: Piece[], currentTurn: PieceColor): string {
  return JSON.stringify({ pieces, currentTurn })
}

// Parse game state from JSON
export function deserializeGameState(json: string): { pieces: Piece[]; currentTurn: PieceColor } {
  return JSON.parse(json)
}
