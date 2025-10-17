import type { Piece, PieceColor, PieceType } from "@/components/game-board"

export type GameType = "soldier" | "tank"

export interface Position {
  row: number
  col: number
}

export interface Move {
  from: Position
  to: Position
  capturedPiecePos?: Position
}

// Check if a position is within board bounds
function isValidPosition(pos: Position): boolean {
  return pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8
}

// Get piece at a specific position
function getPieceAt(pieces: Piece[], pos: Position): Piece | undefined {
  return pieces.find((p) => p.position.row === pos.row && p.position.col === pos.col)
}

// --- Move Calculation ---

function getRegularMoves(piece: Piece, pieces: Piece[]): Position[] {
  const moves: Position[] = []
  const directions = piece.color === "light"
    ? [{ row: -1, col: -1 }, { row: -1, col: 1 }]
    : [{ row: 1, col: -1 }, { row: 1, col: 1 }]

  for (const dir of directions) {
    const newPos = { row: piece.position.row + dir.row, col: piece.position.col + dir.col }
    if (isValidPosition(newPos) && !getPieceAt(pieces, newPos)) {
      moves.push(newPos)
    }
  }
  return moves
}

function getFlyingKingMoves(piece: Piece, pieces: Piece[]): Position[] {
  const moves: Position[] = []
  const directions = [{ row: -1, col: -1 }, { row: -1, col: 1 }, { row: 1, col: -1 }, { row: 1, col: 1 }]

  for (const dir of directions) {
    let currentPos = { row: piece.position.row + dir.row, col: piece.position.col + dir.col }
    while (isValidPosition(currentPos) && !getPieceAt(pieces, currentPos)) {
      moves.push(currentPos)
      currentPos = { row: currentPos.row + dir.row, col: currentPos.col + dir.col }
    }
  }
  return moves
}

function getRegularCaptures(piece: Piece, pieces: Piece[], gameType: GameType): Move[] {
  const captures: Move[] = []
  const directions = [{ row: -1, col: -1 }, { row: -1, col: 1 }, { row: 1, col: -1 }, { row: 1, col: 1 }]

  for (const dir of directions) {
    const jumpOverPos = { row: piece.position.row + dir.row, col: piece.position.col + dir.col }
    const landOnPos = { row: piece.position.row + dir.row * 2, col: piece.position.col + dir.col * 2 }

    if (!isValidPosition(landOnPos)) continue

    const pieceToJump = getPieceAt(pieces, jumpOverPos)
    const isLandingSquareEmpty = !getPieceAt(pieces, landOnPos)

    if (pieceToJump && pieceToJump.color !== piece.color && isLandingSquareEmpty) {
      if (gameType === "soldier" && piece.type === "regular" && pieceToJump.type === "king") {
        continue // Regular pieces cannot capture kings in Soldier mode
      }
      captures.push({ from: piece.position, to: landOnPos, capturedPiecePos: jumpOverPos })
    }
  }
  return captures
}

function getFlyingKingCaptures(piece: Piece, pieces: Piece[]): Move[] {
  const captures: Move[] = []
  const directions = [{ row: -1, col: -1 }, { row: -1, col: 1 }, { row: 1, col: -1 }, { row: 1, col: 1 }]

  for (const dir of directions) {
    for (let i = 1; ; i++) {
      const jumpOverPos = { row: piece.position.row + dir.row * i, col: piece.position.col + dir.col * i }
      if (!isValidPosition(jumpOverPos)) break

      const pieceToJump = getPieceAt(pieces, jumpOverPos)
      if (pieceToJump) {
        if (pieceToJump.color !== piece.color) {
          // Found a piece to capture. Check for empty landing squares behind it.
          for (let j = i + 1; ; j++) {
            const landOnPos = { row: piece.position.row + dir.row * j, col: piece.position.col + dir.col * j }
            if (!isValidPosition(landOnPos) || getPieceAt(pieces, landOnPos)) {
              break // Path is blocked after capture
            }
            captures.push({ from: piece.position, to: landOnPos, capturedPiecePos: jumpOverPos })
          }
        }
        break // Path is blocked by a piece
      }
    }
  }
  return captures
}

export function getValidMoves(piece: Piece, pieces: Piece[], gameType: GameType): Position[] {
  let captures: Move[] = []
  if (gameType === "tank") {
    // In Tank mode, all pieces are effectively kings for movement/capture
    captures = getFlyingKingCaptures(piece, pieces)
  } else { // Soldier mode
    captures = piece.type === "king" 
      ? getFlyingKingCaptures(piece, pieces) 
      : getRegularCaptures(piece, pieces, gameType)
  }

  // Forced capture rule
  const allPlayerPieces = pieces.filter(p => p.color === piece.color)
  const anyCaptureAvailable = allPlayerPieces.some(p => {
    if (gameType === "tank" || p.type === "king") {
        return getFlyingKingCaptures(p, pieces).length > 0
    }
    return getRegularCaptures(p, pieces, gameType).length > 0
  })

  if (anyCaptureAvailable) {
    return captures.map((move) => move.to)
  }

  // Regular moves if no captures are available
  if (gameType === "tank" || piece.type === "king") {
    return getFlyingKingMoves(piece, pieces)
  }
  return getRegularMoves(piece, pieces)
}

// --- Game State Modification ---

export function executeMove(
  pieces: Piece[],
  pieceId: string,
  newPosition: Position,
  gameType: GameType,
): Piece[] {
  const pieceToMove = pieces.find((p) => p.id === pieceId)
  if (!pieceToMove) return pieces

  const oldPosition = pieceToMove.position
  const rowDiff = newPosition.row - oldPosition.row
  const colDiff = newPosition.col - oldPosition.col
  
  let capturedPiecePos: Position | undefined = undefined;
  
  // Check if it's a capture move
  if (Math.abs(rowDiff) > 1) {
    if(pieceToMove.type === 'king' || gameType === 'tank'){
        // Flying King Capture
        const dir = { row: Math.sign(rowDiff), col: Math.sign(colDiff) };
        for (let i = 1; i < Math.abs(rowDiff); i++) {
            const pos = { row: oldPosition.row + dir.row * i, col: oldPosition.col + dir.col * i };
            const jumpedPiece = getPieceAt(pieces, pos);
            if (jumpedPiece) {
                capturedPiecePos = pos;
                break;
            }
        }
    } else {
        // Regular Capture
        capturedPiecePos = {
            row: oldPosition.row + rowDiff / 2,
            col: oldPosition.col + colDiff / 2,
        };
    }
  }

  // Remove the captured piece
  let updatedPieces = pieces;
  if(capturedPiecePos){
      updatedPieces = pieces.filter(p => !(p.position.row === capturedPiecePos?.row && p.position.col === capturedPiecePos?.col));
  }

  // Find the piece again in the potentially updated array
  const pieceIndex = updatedPieces.findIndex((p) => p.id === pieceId)
  if (pieceIndex === -1) return updatedPieces; // Should not happen if logic is correct
  
  const piece = { ...updatedPieces[pieceIndex], position: newPosition };

  // Promote to king if applicable (only in Soldier mode)
  if (gameType === "soldier" && piece.type === "regular") {
    if ((piece.color === "light" && newPosition.row === 0) || (piece.color === "dark" && newPosition.row === 7)) {
      piece.type = "king"
    }
  }

  updatedPieces[pieceIndex] = piece;

  return updatedPieces
}

// --- Board Initialization ---

export function initializeBoard(gameType: GameType): Piece[] {
    const pieces: Piece[] = []
    let pieceId = 0
  
    const pieceType: PieceType = gameType === 'tank' ? 'king' : 'regular';

    // Dark pieces
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          pieces.push({
            id: `piece-${pieceId++}`,
            type: pieceType,
            color: "dark",
            position: { row, col },
          })
        }
      }
    }
  
    // Light pieces
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          pieces.push({
            id: `piece-${pieceId++}`,
            type: pieceType,
            color: "light",
            position: { row, col },
          })
        }
      }
    }
  
    return pieces
  }

// --- Game Over Detection ---

export function hasPlayerLost(
  pieces: Piece[],
  playerColor: PieceColor,
  gameType: GameType
): boolean {
  // Player loses if they have no pieces left
  const playerPieces = pieces.filter((p) => p.color === playerColor);
  if (playerPieces.length === 0) {
    return true;
  }

  // Player loses if they have pieces but no valid moves
  const hasValidMoves = playerPieces.some(
    (p) => getValidMoves(p, pieces, gameType).length > 0
  );
  if (!hasValidMoves) {
    return true;
  }

  return false;
}
