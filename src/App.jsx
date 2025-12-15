import { useState, useEffect, useCallback, useRef } from "react";
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { motion } from "motion/react";
import "./App.css";
import { GlowEffect } from "./components/GlowEffect";
import { auth, db } from "./firebase";

const GRID_SIZE = 5;

// Generate game code
const generateGameCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Card abilities
const CARD_ABILITIES = {
  CLEAR_ROW: "clear_row",
  CLEAR_COL: "clear_col",
  DOUBLE_ADJACENT: "double_adjacent",
  CLEAR_RANDOM: "clear_random",
  DOUBLE_POINTS: "double_points",
  SWAP_MOVE: "swap_move",
  GLOBAL_CROP_BOOST: "global_crop_boost",
  GLOBAL_AURA: "global_aura",
};

// Farm card types - REDUCED BUILDINGS, MORE CROPS
const CARD_TYPES = {
  // Crops - INCREASED
  WHEAT: {
    name: "Wheat",
    emoji: "🌾",
    basePoints: 2,
    type: "crop",
    color: "#F5DEB3",
    description: "Basic crop. Works well near Mills for processing.",
    ability: null,
    strategy:
      "Place Wheat near Mills for +3 bonus. Great for early game setup.",
  },
  CORN: {
    name: "Corn",
    emoji: "🌽",
    basePoints: 3,
    type: "crop",
    color: "#FFD700",
    description: "High-value crop. Pairs excellently with Mills.",
    ability: null,
    strategy:
      "Corn + Mill = 6 points! Place strategically to maximize synergy.",
  },
  CARROT: {
    name: "Carrot",
    emoji: "🥕",
    basePoints: 2,
    type: "crop",
    color: "#FF8C00",
    description: "Fast-growing crop. Benefits from Wells and Scarecrows.",
    ability: null,
    strategy:
      "Use Carrots to fill gaps and create crop clusters for +1 bonuses.",
  },
  POTATO: {
    name: "Potato",
    emoji: "🥔",
    basePoints: 2,
    type: "crop",
    color: "#DEB887",
    description: "Staple crop. Versatile and easy to synergize.",
    ability: null,
    strategy:
      "Potatoes work well in groups. Place multiple together for adjacency bonuses.",
  },
  TOMATO: {
    name: "Tomato",
    emoji: "🍅",
    basePoints: 3,
    type: "crop",
    color: "#FF6347",
    description: "Valuable crop. Thrives near Greenhouses.",
    ability: null,
    strategy: "Tomatoes + Greenhouse = 6 points. Great mid-game value.",
  },
  PUMPKIN: {
    name: "Pumpkin",
    emoji: "🎃",
    basePoints: 3,
    type: "crop",
    color: "#FF8C00",
    description: "Seasonal crop. High base value.",
    ability: null,
    strategy:
      "Pumpkins are solid standalone cards. Use when you need immediate points.",
  },
  STRAWBERRY: {
    name: "Strawberry",
    emoji: "🍓",
    basePoints: 2,
    type: "crop",
    color: "#FF69B4",
    description: "Delicate crop. Benefits from careful placement.",
    ability: null,
    strategy: "Place Strawberries near other crops for type bonuses.",
  },
  APPLE: {
    name: "Apple",
    emoji: "🍎",
    basePoints: 2,
    type: "crop",
    color: "#FF4500",
    description: "Classic crop. Reliable points.",
    ability: null,
    strategy: "Apples are versatile. Use them to complete crop formations.",
  },
  GRAPES: {
    name: "Grapes",
    emoji: "🍇",
    basePoints: 3,
    type: "crop",
    color: "#9370DB",
    description: "Premium crop. Works well with processing buildings.",
    ability: null,
    strategy:
      "Grapes + Mill = 6 points. Plan your Mill placement around Grapes.",
  },
  WATERMELON: {
    name: "Watermelon",
    emoji: "🍉",
    basePoints: 4,
    type: "crop",
    color: "#FF6B6B",
    description: "High-value crop. Best when paired with buildings.",
    ability: null,
    strategy:
      "Watermelons are expensive but powerful. Save for high-value placements.",
  },
  BEANS: {
    name: "Beans",
    emoji: "🫘",
    basePoints: 2,
    type: "crop",
    color: "#90EE90",
    description: "Legume crop. Good for soil health.",
    ability: null,
    strategy: "Beans work well in crop rotations. Place near other crops.",
  },
  PEPPER: {
    name: "Pepper",
    emoji: "🫑",
    basePoints: 3,
    type: "crop",
    color: "#FF4500",
    description: "Spicy crop. High value.",
    ability: null,
    strategy: "Peppers are valuable. Use them strategically near buildings.",
  },

  // Animals
  CHICKEN: {
    name: "Chicken",
    emoji: "🐔",
    basePoints: 3,
    type: "animal",
    color: "#FFE4E1",
    description: "Small farm animal. Needs Barn or Fence for protection.",
    ability: null,
    strategy:
      "Chickens + Barn = 7 points! Always place near Barns when possible.",
  },
  COW: {
    name: "Cow",
    emoji: "🐄",
    basePoints: 5,
    type: "animal",
    color: "#F0F0F0",
    description: "Large animal. High base value, great with Barns.",
    ability: null,
    strategy: "Cows are your highest-value animals. Barn + Cow = 9 points!",
  },
  PIG: {
    name: "Pig",
    emoji: "🐷",
    basePoints: 4,
    type: "animal",
    color: "#FFB6C1",
    description: "Medium animal. Good synergy potential.",
    ability: null,
    strategy: "Pigs work well in animal clusters. Place near Barns and Fences.",
  },
  SHEEP: {
    name: "Sheep",
    emoji: "🐑",
    basePoints: 4,
    type: "animal",
    color: "#FFFFFF",
    description: "Flock animal. Benefits from grouping.",
    ability: null,
    strategy: "Multiple Sheep together create strong animal formations.",
  },
  HORSE: {
    name: "Horse",
    emoji: "🐴",
    basePoints: 6,
    type: "animal",
    color: "#8B4513",
    description: "Premium animal. Highest base value.",
    ability: null,
    strategy:
      "Horses are game-changers. Save for perfect Barn placements (10 points!).",
  },
  BEE: {
    name: "Bee",
    emoji: "🐝",
    basePoints: 2,
    type: "animal",
    color: "#FFD700",
    description: "Pollinator. Helps crops grow.",
    ability: CARD_ABILITIES.DOUBLE_ADJACENT,
    strategy:
      "Bees double points of adjacent crops! Place Bees strategically between crops.",
  },

  // Buildings - REDUCED
  BARN: {
    name: "Barn",
    emoji: "🏚️",
    basePoints: 4,
    type: "building",
    color: "#CD853F",
    description: "Animal shelter. Gives +4 bonus to adjacent animals.",
    ability: null,
    strategy:
      "Place Barns first, then surround with animals. Each animal gets +4!",
  },
  MILL: {
    name: "Mill",
    emoji: "🏭",
    basePoints: 5,
    type: "building",
    color: "#D3D3D3",
    description: "Crop processor. Gives +3 bonus to adjacent crops.",
    ability: null,
    strategy:
      "Mills are crop multipliers. Place in center and surround with crops.",
  },
  FENCE: {
    name: "Fence",
    emoji: "🪵",
    basePoints: 2,
    type: "building",
    color: "#8B7355",
    description: "Animal enclosure. Gives +2 bonus to adjacent animals.",
    ability: null,
    strategy: "Fences are cheap but effective. Use to boost multiple animals.",
  },
  WELL: {
    name: "Well",
    emoji: "⛲",
    basePoints: 3,
    type: "building",
    color: "#B0C4DE",
    description: "Water source. Gives +2 bonus to adjacent crops.",
    ability: null,
    strategy:
      "Wells help crops thrive. Place near crop clusters for maximum effect.",
  },

  // Special
  TRACTOR: {
    name: "Tractor",
    emoji: "🚜",
    basePoints: 6,
    type: "special",
    color: "#FFA500",
    description: "Farm vehicle. Gives +2 bonus to ALL adjacent tiles.",
    ability: null,
    strategy:
      "Tractors boost everything nearby! Place in high-traffic areas for maximum value.",
  },
  SEEDS: {
    name: "Seeds",
    emoji: "🌱",
    basePoints: 1,
    type: "special",
    color: "#90EE90",
    description: "Planting material. Low cost, high potential.",
    ability: CARD_ABILITIES.DOUBLE_POINTS,
    strategy:
      "Seeds double their own points when placed. Use on high-value spots for 2x multiplier!",
  },
  FERTILIZER: {
    name: "Fertilizer",
    emoji: "💩",
    basePoints: 3,
    type: "special",
    color: "#8B4513",
    description: "Soil enhancer. Clears a random tile when placed.",
    ability: CARD_ABILITIES.CLEAR_RANDOM,
    strategy:
      "Fertilizer clears a random tile! Use it to remove low-value cards and make room for better placements.",
  },
  RAIN: {
    name: "Rain",
    emoji: "🌧️",
    basePoints: 2,
    type: "special",
    color: "#87CEEB",
    description: "Weather effect. Gives +2 bonus to adjacent crops.",
    ability: null,
    strategy: "Rain helps crops grow. Place near crop clusters for bonuses.",
  },
  SUN: {
    name: "Sun",
    emoji: "☀️",
    basePoints: 3,
    type: "special",
    color: "#FFD700",
    description: "Weather effect. Gives +2 bonus to adjacent crops.",
    ability: null,
    strategy: "Sun boosts crops. Use it to maximize crop point values.",
  },
  SHOVEL: {
    name: "Shovel",
    emoji: "🪣",
    basePoints: 2,
    type: "special",
    color: "#8B7355",
    description:
      "Tool for moving cards. Click to select a card to move, then click destination.",
    ability: CARD_ABILITIES.SWAP_MOVE,
    strategy:
      "Use Shovel to rearrange your board! Select a card, then click where to move it. Perfect for optimizing synergies.",
  },
  GOLDEN_TRACTOR: {
    name: "Golden Tractor",
    emoji: "🚜✨",
    basePoints: 8,
    type: "special",
    color: "#FFD54F",
    rarity: "shiny",
    shiny: true,
    description: "Legendary tractor. Grants +2 to every placed card when played.",
    ability: CARD_ABILITIES.GLOBAL_AURA,
    strategy:
      "Drop early to supercharge the whole board. Best when many tiles are already filled.",
  },
  AURORA_RAIN: {
    name: "Aurora Rain",
    emoji: "🌈🌧️",
    basePoints: 5,
    type: "special",
    color: "#A5D8FF",
    rarity: "shiny",
    shiny: true,
    description: "Prismatic downpour. Gives +2 to every crop on the board.",
    ability: CARD_ABILITIES.GLOBAL_CROP_BOOST,
    strategy:
      "Play after establishing multiple crops to get an immediate board-wide boost.",
  },
  PHOENIX: {
    name: "Phoenix",
    emoji: "🐦‍🔥",
    basePoints: 7,
    type: "special",
    color: "#FF7043",
    rarity: "shiny",
    shiny: true,
    description: "Mythic bird. Doubles its own points and clears a random tile.",
    ability: CARD_ABILITIES.DOUBLE_POINTS,
    strategy:
      "Use to open space and score big in one drop. Great for late-game swings.",
  },
};

// Synergy rules
const SYNERGIES = {
  crop_mill: { bonus: 3, description: "Crops near Mill" },
  animal_barn: { bonus: 4, description: "Animals near Barn" },
  animal_fence: { bonus: 2, description: "Animals near Fence" },
  crop_well: { bonus: 2, description: "Crops near Well" },
  crop_scarecrow: { bonus: 2, description: "Crops near Scarecrow" },
  crop_greenhouse: { bonus: 3, description: "Crops near Greenhouse" },
  crop_silo: { bonus: 2, description: "Crops near Silo" },
  same_type: { bonus: 1, description: "Same type adjacent" },
  tractor_any: { bonus: 2, description: "Tractor nearby" },
  rain_crop: { bonus: 2, description: "Rain near Crops" },
  sun_crop: { bonus: 2, description: "Sun near Crops" },
};

function App() {
  const [grid, setGrid] = useState(
    Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(null))
  );
  const [hand, setHand] = useState([]);
  const [score, setScore] = useState(0);
  const [selectedCard, setSelectedCard] = useState(null);
  const [draggedCard, setDraggedCard] = useState(null);
  const [gameCode, setGameCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userId, setUserId] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [showNameInput, setShowNameInput] = useState(true);
  const [showMultiplayerModal, setShowMultiplayerModal] = useState(false);
  const [showDictionary, setShowDictionary] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [selectedCardForDetail, setSelectedCardForDetail] = useState(null);
  const [shovelMode, setShovelMode] = useState(false);
  const [cardToMove, setCardToMove] = useState(null);
  const [synergyHighlights, setSynergyHighlights] = useState({});
  const [selectedTileInfo, setSelectedTileInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("game");
  const hoverOscRef = useRef(null);
  const clickOscRef = useRef(null);

  // Initialize deck - REDUCED COPIES
  const createDeck = () => {
    const deck = [];
    const cardEntries = Object.entries(CARD_TYPES);

    // Reduced copies - less redundancy; shiny cards are very rare (1 copy)
    cardEntries.forEach(([key, card]) => {
      const copies =
        card.rarity === "shiny"
          ? 1
          : card.basePoints <= 2
          ? 5
          : card.basePoints <= 4
          ? 4
          : card.basePoints <= 5
          ? 3
          : 2;
      for (let i = 0; i < copies; i++) {
        deck.push({ ...card, id: `${key}_${i}`, cardKey: key });
      }
    });

    // Shuffle deck
    return deck.sort(() => Math.random() - 0.5);
  };

  const [deck, setDeck] = useState(createDeck());

  // Draw cards to hand
  const drawCards = useCallback(() => {
    if (gameEnded) return;
    // Use functional updates to check actual state and prevent duplicates
    // Check hand length inside the functional update to use actual current state
    setHand((prevHand) => {
      if (prevHand.length >= 5) {
        return prevHand;
      }
      const cardsToDraw = Math.min(5 - prevHand.length, deck.length);
      const drawn = deck.slice(0, cardsToDraw);
      // Update deck - remove the cards we're drawing
      setDeck((prevDeck) => prevDeck.slice(cardsToDraw));
      return [...prevHand, ...drawn];
    });
  }, [hand.length, deck, gameEnded]);

  // Initialize hand
  useEffect(() => {
    if (hand.length === 0 && deck.length > 0 && !gameEnded) {
      drawCards();
    }
  }, [hand.length, deck.length, drawCards, gameEnded]);

  // Calculate synergies and highlight them
  const calculateSynergies = (row, col, cardType) => {
    let bonus = 0;
    const synergies = [];
    const highlights = [];

    const neighbors = [
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1],
    ].filter(([r, c]) => r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE);

    neighbors.forEach(([r, c]) => {
      const neighbor = grid[r][c];
      if (!neighbor) return;

      const neighborType = neighbor.cardKey
        ? CARD_TYPES[neighbor.cardKey]
        : neighbor;

      if (
        cardType.type === "crop" &&
        neighborType.type === "building" &&
        neighborType.name === "Mill"
      ) {
        bonus += SYNERGIES.crop_mill.bonus;
        synergies.push(SYNERGIES.crop_mill.description);
        highlights.push({ row: r, col: c, bonus: SYNERGIES.crop_mill.bonus });
      }
      if (
        cardType.type === "animal" &&
        neighborType.type === "building" &&
        neighborType.name === "Barn"
      ) {
        bonus += SYNERGIES.animal_barn.bonus;
        synergies.push(SYNERGIES.animal_barn.description);
        highlights.push({ row: r, col: c, bonus: SYNERGIES.animal_barn.bonus });
      }
      if (
        cardType.type === "animal" &&
        neighborType.type === "building" &&
        neighborType.name === "Fence"
      ) {
        bonus += SYNERGIES.animal_fence.bonus;
        synergies.push(SYNERGIES.animal_fence.description);
        highlights.push({
          row: r,
          col: c,
          bonus: SYNERGIES.animal_fence.bonus,
        });
      }
      if (
        cardType.type === "crop" &&
        neighborType.type === "building" &&
        neighborType.name === "Well"
      ) {
        bonus += SYNERGIES.crop_well.bonus;
        synergies.push(SYNERGIES.crop_well.description);
        highlights.push({ row: r, col: c, bonus: SYNERGIES.crop_well.bonus });
      }
      if (
        cardType.type === neighborType.type &&
        cardType.name !== neighborType.name
      ) {
        bonus += SYNERGIES.same_type.bonus;
        synergies.push(SYNERGIES.same_type.description);
        highlights.push({ row: r, col: c, bonus: SYNERGIES.same_type.bonus });
      }
      if (neighborType.name === "Tractor") {
        bonus += SYNERGIES.tractor_any.bonus;
        synergies.push(SYNERGIES.tractor_any.description);
        highlights.push({ row: r, col: c, bonus: SYNERGIES.tractor_any.bonus });
      }
      if (neighborType.name === "Rain" && cardType.type === "crop") {
        bonus += SYNERGIES.rain_crop.bonus;
        synergies.push(SYNERGIES.rain_crop.description);
        highlights.push({ row: r, col: c, bonus: SYNERGIES.rain_crop.bonus });
      }
      if (neighborType.name === "Sun" && cardType.type === "crop") {
        bonus += SYNERGIES.sun_crop.bonus;
        synergies.push(SYNERGIES.sun_crop.description);
        highlights.push({ row: r, col: c, bonus: SYNERGIES.sun_crop.bonus });
      }
      // Bee ability: double adjacent crop points
      if (neighborType.name === "Bee" && cardType.type === "crop") {
        bonus += cardType.basePoints;
        synergies.push("Bee pollination bonus");
        highlights.push({
          row: r,
          col: c,
          bonus: cardType.basePoints,
          special: true,
        });
      }
    });

    return { bonus, synergies, highlights };
  };

  // Apply card abilities
  const applyCardAbility = (cardData, row, col) => {
    const newGrid = grid.map((r) => [...r]);
    let pointsEarned = 0;

    switch (cardData.ability) {
      case CARD_ABILITIES.CLEAR_RANDOM:
        const filledTiles = [];
        newGrid.forEach((r, ri) => {
          r.forEach((c, ci) => {
            if (c && !(ri === row && ci === col)) {
              filledTiles.push([ri, ci]);
            }
          });
        });
        if (filledTiles.length > 0) {
          const randomTile =
            filledTiles[Math.floor(Math.random() * filledTiles.length)];
          newGrid[randomTile[0]][randomTile[1]] = null;
        }
        break;

      case CARD_ABILITIES.DOUBLE_ADJACENT:
        const neighbors = [
          [row - 1, col],
          [row + 1, col],
          [row, col - 1],
          [row, col + 1],
        ].filter(
          ([r, c]) => r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE
        );

        neighbors.forEach(([r, c]) => {
          const neighbor = newGrid[r][c];
          if (neighbor && neighbor.type === "crop") {
            const neighborCard = neighbor.cardKey
              ? CARD_TYPES[neighbor.cardKey]
              : neighbor;
            const bonusPoints = neighborCard.basePoints;
            newGrid[r][c].points += bonusPoints;
            pointsEarned += bonusPoints;
          }
        });
        break;

      case CARD_ABILITIES.DOUBLE_POINTS:
        pointsEarned = cardData.basePoints;
        // Phoenix gets a small clear effect as part of its mythic play
        if (cardData.name === "Phoenix") {
          const filledTiles = [];
          newGrid.forEach((r, ri) => {
            r.forEach((c, ci) => {
              if (c && !(ri === row && ci === col)) {
                filledTiles.push([ri, ci]);
              }
            });
          });
          if (filledTiles.length > 0) {
            const randomTile =
              filledTiles[Math.floor(Math.random() * filledTiles.length)];
            newGrid[randomTile[0]][randomTile[1]] = null;
          }
        }
        break;

      case CARD_ABILITIES.GLOBAL_CROP_BOOST:
        newGrid.forEach((r, ri) => {
          r.forEach((c, ci) => {
            if (c && (c.type === "crop" || c.cardKey?.includes("CROP"))) {
              newGrid[ri][ci].points = (newGrid[ri][ci].points || c.basePoints) + 2;
              pointsEarned += 2;
            }
          });
        });
        break;

      case CARD_ABILITIES.GLOBAL_AURA:
        newGrid.forEach((r, ri) => {
          r.forEach((c, ci) => {
            if (c) {
              newGrid[ri][ci].points = (newGrid[ri][ci].points || c.basePoints) + 2;
              pointsEarned += 2;
            }
          });
        });
        break;

      default:
        break;
    }

    return { newGrid, pointsEarned };
  };

  // Place card on grid
  const placeCard = (row, col, cardToPlace = null) => {
    if (gameEnded) return;

    // Handle shovel mode
    if (shovelMode && cardToMove) {
      const [moveRow, moveCol] = cardToMove;
      const cardBeingMoved = grid[moveRow][moveCol];

      if (grid[row][col] === null && cardBeingMoved) {
        // Move the card
        const newGrid = grid.map((r) => [...r]);
        newGrid[row][col] = cardBeingMoved;
        newGrid[moveRow][moveCol] = null;

        // Recalculate points for moved card
        const cardData = cardBeingMoved.cardKey
          ? CARD_TYPES[cardBeingMoved.cardKey]
          : cardBeingMoved;
        const { bonus } = calculateSynergies(row, col, cardData);
        const newPoints = cardData.basePoints + bonus;
        newGrid[row][col].points = newPoints;

        setGrid(newGrid);
        setShovelMode(false);
        setCardToMove(null);
        setSelectedCard(null);

        // Recalculate score
        let newScore = 0;
        newGrid.forEach((row) => {
          row.forEach((cell) => {
            if (cell) newScore += cell.points;
          });
        });
        setScore(newScore);

        if (isMultiplayer && gameCode && db) {
          const gameRef = doc(db, "games", gameCode);
          updateDoc(gameRef, {
            grid: newGrid,
            score: newScore,
            lastUpdated: new Date().toISOString(),
          });
        }
      }
      return;
    }

    const card = cardToPlace || selectedCard;
    if (!card || grid[row][col] !== null) return;

    const cardData = card.cardKey ? CARD_TYPES[card.cardKey] : card;

    // Handle shovel card selection
    if (cardData.ability === CARD_ABILITIES.SWAP_MOVE) {
      setShovelMode(true);
      setSelectedCard(null);
      setHand((prev) => prev.filter((c) => c.id !== card.id));
      drawCards();
      return;
    }

    const { bonus, synergies, highlights } = calculateSynergies(
      row,
      col,
      cardData
    );
    let points = cardData.basePoints + bonus;

    // Apply card ability
    const { newGrid: gridAfterAbility, pointsEarned: abilityPoints } =
      applyCardAbility(cardData, row, col);
    const finalGrid = gridAfterAbility.map((r) => [...r]);

    // Handle Seeds double points ability
    if (cardData.ability === CARD_ABILITIES.DOUBLE_POINTS) {
      points = points * 2;
    }

    finalGrid[row][col] = {
      ...cardData,
      id: card.id,
      cardKey: card.cardKey,
      points,
      synergies,
    };

    // Show synergy highlights temporarily
    const highlightMap = {};
    highlights.forEach((h) => {
      highlightMap[`${h.row}-${h.col}`] = h;
    });
    setSynergyHighlights(highlightMap);
    setTimeout(() => setSynergyHighlights({}), 2000);

    setGrid(finalGrid);
    setScore((prev) => prev + points + abilityPoints);
    setHand((prev) => prev.filter((c) => c.id !== card.id));
    setSelectedCard(null);
    setDraggedCard(null);
    if (!gameEnded) {
      drawCards();
    }

    // Save to Firestore if multiplayer
    if (isMultiplayer && gameCode && db) {
      const gameRef = doc(db, "games", gameCode);
      updateDoc(gameRef, {
        grid: finalGrid,
        score,
        lastUpdated: new Date().toISOString(),
      });
    }
  };

  // Handle grid cell click for shovel mode and tile info
  const handleGridCellClick = (row, col) => {
    if (gameEnded) {
      // Still allow info viewing
      const cell = grid[row][col];
      if (cell) {
        const cellData = cell.cardKey ? CARD_TYPES[cell.cardKey] : cell;
        const { synergies } = calculateSynergies(row, col, cellData);
        setSelectedTileInfo({
          row,
          col,
          card: cell,
          synergies,
          points: cell.points,
          base: cellData.basePoints,
        });
      } else {
        setSelectedTileInfo(null);
      }
      return;
    }

    if (shovelMode) {
      if (!cardToMove) {
        // Select card to move
        if (grid[row][col]) {
          setCardToMove([row, col]);
          const cell = grid[row][col];
          const cellData = cell.cardKey ? CARD_TYPES[cell.cardKey] : cell;
          const { synergies } = calculateSynergies(row, col, cellData);
          setSelectedTileInfo({
            row,
            col,
            card: cell,
            synergies,
            points: cell.points,
            base: cellData.basePoints,
          });
        }
      } else {
        // Move to destination
        placeCard(row, col);
      }
    } else {
      const cell = grid[row][col];
      if (cell) {
        const cellData = cell.cardKey ? CARD_TYPES[cell.cardKey] : cell;
        const { synergies } = calculateSynergies(row, col, cellData);
        setSelectedTileInfo({
          row,
          col,
          card: cell,
          synergies,
          points: cell.points,
          base: cellData.basePoints,
        });
      } else {
        setSelectedTileInfo(null);
        placeCard(row, col);
      }
    }
  };

  // Drag handlers
  const handleDragStart = (e, card) => {
    if (gameEnded) return;
    setDraggedCard(card);
    setSelectedCard(card);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, row, col) => {
    e.preventDefault();
    if (draggedCard && grid[row][col] === null && !gameEnded) {
      placeCard(row, col, draggedCard);
    }
  };

  // Submit score to leaderboard
  const submitScore = async () => {
    if (!db) {
      alert("Firebase is not configured. Leaderboard features are disabled.");
      setGameEnded(true);
      return;
    }
    if (!userId || !playerName) {
      alert("Please wait for authentication...");
      return;
    }

    try {
      await addDoc(collection(db, "leaderboard"), {
        playerName,
        score,
        timestamp: new Date().toISOString(),
        userId,
      });
      setGameEnded(true);
      alert(`Score of ${score} submitted to leaderboard! Game ended.`);
    } catch (error) {
      console.error("Error submitting score:", error);
      alert(
        "Failed to submit score. Please check your Firebase configuration and permissions."
      );
    }
  };

  // Create multiplayer game with code
  const createMultiplayerGame = async () => {
    if (!db) {
      alert("Firebase is not configured. Multiplayer features are disabled.");
      setShowMultiplayerModal(false);
      return;
    }
    if (!userId) {
      alert("Please wait for authentication...");
      return;
    }

    try {
      const code = generateGameCode();
      const gameRef = doc(db, "games", code);
      await setDoc(gameRef, {
        grid: Array(GRID_SIZE)
          .fill(null)
          .map(() => Array(GRID_SIZE).fill(null)),
        score: 0,
        players: [userId],
        playerNames: [playerName],
        created: new Date().toISOString(),
        gameCode: code,
      });
      setGameCode(code);
      setIsMultiplayer(true);
      setShowMultiplayerModal(false);
    } catch (error) {
      console.error("Error creating game:", error);
      alert(
        "Failed to create game. Please check your Firebase configuration and permissions."
      );
    }
  };

  // Join multiplayer game by code
  const joinMultiplayerGame = async () => {
    if (!db) {
      alert("Firebase is not configured. Multiplayer features are disabled.");
      setShowMultiplayerModal(false);
      return;
    }
    if (!userId) {
      alert("Please wait for authentication...");
      return;
    }
    if (!joinCode.trim()) {
      alert("Please enter a game code.");
      return;
    }

    try {
      const gameRef = doc(db, "games", joinCode.toUpperCase());
      const gameSnap = await getDoc(gameRef);

      if (!gameSnap.exists()) {
        alert("Game code not found!");
        return;
      }

      const gameData = gameSnap.data();
      const players = gameData.players || [];
      const playerNames = gameData.playerNames || [];

      if (players.includes(userId)) {
        alert("You are already in this game!");
        return;
      }

      await updateDoc(gameRef, {
        players: [...players, userId],
        playerNames: [...playerNames, playerName],
      });

      setGameCode(joinCode.toUpperCase());
      setIsMultiplayer(true);
      setShowMultiplayerModal(false);
      setJoinCode("");
    } catch (error) {
      console.error("Error joining game:", error);
      alert(
        "Error joining game. Please check the code and your Firebase permissions."
      );
    }
  };

  // Initialize auth
  useEffect(() => {
    if (!auth) {
      console.warn("Firebase Auth not available. Running in offline mode.");
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) {
          try {
            await signInAnonymously(auth);
          } catch (error) {
            console.warn(
              "Auth error (app will continue in offline mode):",
              error
            );
          }
        } else {
          setUserId(user.uid);
        }
      },
      (error) => {
        console.warn(
          "Auth state change error (app will continue in offline mode):",
          error
        );
      }
    );

    return () => unsubscribe();
  }, [auth]);

  // Load leaderboard
  useEffect(() => {
    if (!db) return;

    const q = query(
      collection(db, "leaderboard"),
      orderBy("score", "desc"),
      limit(10)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const scores = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLeaderboard(scores);
    });

    return () => unsubscribe();
  }, [db]);

  // Load multiplayer game
  useEffect(() => {
    if (!db || !gameCode) return;

    const gameRef = doc(db, "games", gameCode);
    const unsubscribe = onSnapshot(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.grid) {
          const restoredGrid = data.grid.map((row) =>
            row.map((cell) => {
              if (cell && !cell.cardKey && cell.name) {
                const cardEntry = Object.entries(CARD_TYPES).find(
                  ([, card]) => card.name === cell.name
                );
                if (cardEntry) {
                  return { ...cell, cardKey: cardEntry[0] };
                }
              }
              return cell;
            })
          );
          setGrid(restoredGrid);
        }
        if (data.score !== undefined) setScore(data.score);
      }
    });

    return () => unsubscribe();
  }, [db, gameCode]);

  const startNewGame = () => {
    setGrid(
      Array(GRID_SIZE)
        .fill(null)
        .map(() => Array(GRID_SIZE).fill(null))
    );
    setScore(0);
    setDeck(createDeck());
    setHand([]);
    setSelectedCard(null);
    setDraggedCard(null);
    setGameCode("");
    setIsMultiplayer(false);
    setGameEnded(false);
    setShovelMode(false);
    setCardToMove(null);
    setSelectedCardForDetail(null);
    drawCards();
  };

  // Get card detail for selected card
  const getCardDetail = () => {
    if (!selectedCardForDetail) return null;
    const cardData = selectedCardForDetail.cardKey
      ? CARD_TYPES[selectedCardForDetail.cardKey]
      : selectedCardForDetail;
    return cardData;
  };

  const cardDetail = getCardDetail();

  // --- sound helpers (Web Audio) ---
  const playTone = (
    freq = 880,
    duration = 0.06,
    gain = 0.08,
    type = "sine"
  ) => {
    if (typeof window === "undefined") return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(g).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  const playHoverSound = () => playTone(520, 0.08, 0.04, "sine");
  const playClickSound = () => playTone(320, 0.12, 0.06, "triangle");

  return (
    <div className="app">
      {showNameInput ? (
        <div className="name-input-modal">
          <div className="modal-content">
            <h1 className="game-title">🌾 Farm Grid Game 🌾</h1>
            <p className="game-tagline">Pastel farm strategy on a 5x5 grid</p>
            <h2>Enter Your Name</h2>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your name"
              maxLength={20}
              onKeyPress={(e) => {
                if (e.key === "Enter" && playerName.trim()) {
                  setShowNameInput(false);
                }
              }}
            />
            <button
              onClick={() => {
                if (playerName.trim()) {
                  setShowNameInput(false);
                }
              }}
              disabled={!playerName.trim()}
            >
              Start Playing
            </button>
          </div>
        </div>
      ) : (
        <div className="game-container">
          <header className="game-header">
            <div className="score-display">
              <div className="score">Score: {score}</div>
              <div className="player-name">{playerName || "Player"}</div>
              {isMultiplayer && gameCode && (
                <div className="game-code-display">
                  Game: <strong>{gameCode}</strong>
                </div>
              )}
              {gameEnded && <div className="game-ended-badge">Game Ended</div>}
              {shovelMode && (
                <div className="shovel-mode-badge">
                  🪣 Shovel Mode: Select card to move
                </div>
              )}
            </div>
          </header>

          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === "game" ? "active" : ""}`}
              onClick={() => setActiveTab("game")}
            >
              Game
            </button>
            <button
              className={`tab-btn ${
                activeTab === "leaderboard" ? "active" : ""
              }`}
              onClick={() => setActiveTab("leaderboard")}
            >
              Leaderboard
            </button>
          </div>

          {activeTab === "game" && (
            <>
              {/* HAND AT TOP (HORIZONTAL) */}
              <div className="hand-panel horizontal">
                <h3>Hand ({hand.length}/5)</h3>
                <div className="hand">
                  {hand.map((card) => {
                    const cardData = card.cardKey
                      ? CARD_TYPES[card.cardKey]
                      : card;
                    const isSpecial = !!cardData.ability;
                    const isShiny =
                      cardData.shiny ||
                      cardData.rarity === "shiny" ||
                      card.shiny;
                    return (
                      <motion.div
                        key={card.id}
                        className={`card ${
                          selectedCardForDetail?.id === card.id
                            ? "selected-detail"
                            : ""
                        } ${selectedCard?.id === card.id ? "selected" : ""} ${
                          gameEnded ? "disabled" : ""
                        } ${isShiny ? "shiny" : ""}`}
                        onClick={() => {
                          if (!gameEnded) {
                            setSelectedCardForDetail(card);
                            setSelectedCard(card);
                            playClickSound();
                          }
                        }}
                        onMouseEnter={() => !gameEnded && playHoverSound()}
                        draggable={!gameEnded}
                        onDragStart={(e) =>
                          !gameEnded && handleDragStart(e, card)
                        }
                        style={{ backgroundColor: cardData.color }}
                        whileHover={!gameEnded ? { y: -3, scale: 1.01 } : {}}
                        whileTap={!gameEnded ? { scale: 0.99 } : {}}
                        transition={{
                          type: "spring",
                          stiffness: 240,
                          damping: 20,
                        }}
                      >
                        <div className="card-shell">
                          {(isSpecial || isShiny) && (
                            <GlowEffect
                              className="rounded-2xl"
                              mode="flowHorizontal"
                              blur="soft"
                              colors={
                                isShiny
                                  ? ["#fff0b3", "#ffd166", "#c084fc", "#7dd3fc"]
                                  : ["#ffd166", "#ff6b6b", "#7dd3fc", "#c084fc"]
                              }
                              duration={isShiny ? 5 : 6}
                              scale={1.2}
                            />
                          )}
                          <div className="card-surface">
                            <div className="card-top">
                              <div className="card-emoji">{cardData.emoji}</div>
                              {isSpecial && (
                                <div className="card-ability-badge">⚡</div>
                              )}
                              {isShiny && (
                                <div className="card-shiny-badge">⭐</div>
                              )}
                            </div>
                            <div className="card-name-small">
                              {cardData.name}
                            </div>
                            <div className="card-points">
                              {cardData.basePoints} pts
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="main-game-area two-columns">
                {/* DESCRIPTION PANEL */}
                <div className="description-panel wide">
                  {cardDetail ? (
                    <div className="card-detail-view">
                      <div className="detail-header">
                        <span className="detail-emoji">{cardDetail.emoji}</span>
                        <div>
                          <h3>{cardDetail.name}</h3>
                          <div className="detail-meta">
                            <span className="detail-type">
                              {cardDetail.type}
                            </span>
                            <span className="detail-points">
                              {cardDetail.basePoints} pts
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="detail-description">
                        <strong>Description:</strong>
                        <p>{cardDetail.description}</p>
                      </div>
                      {cardDetail.ability && (
                        <div className="detail-ability">
                          <strong>Special Ability:</strong>
                          <p>
                            {cardDetail.ability === CARD_ABILITIES.CLEAR_RANDOM
                              ? "Clears a random tile when placed"
                              : cardDetail.ability ===
                                CARD_ABILITIES.DOUBLE_ADJACENT
                              ? "Doubles points of adjacent crops"
                              : cardDetail.ability ===
                                CARD_ABILITIES.DOUBLE_POINTS
                              ? "Doubles its own points when placed"
                              : cardDetail.ability === CARD_ABILITIES.SWAP_MOVE
                              ? "Click to enter move mode, then select card to move and destination"
                              : cardDetail.ability ===
                                CARD_ABILITIES.GLOBAL_CROP_BOOST
                              ? "Gives +2 to every crop on the board"
                              : cardDetail.ability ===
                                CARD_ABILITIES.GLOBAL_AURA
                              ? "Gives +2 to every placed card"
                              : cardDetail.ability}
                          </p>
                        </div>
                      )}
                      <div className="detail-synergies">
                        <strong>Synergies:</strong>
                        <ul>
                          {cardDetail.type === "crop" && (
                            <>
                              <li>Near Mill: +3 points</li>
                              <li>Near Well: +2 points</li>
                              <li>Near Rain: +2 points</li>
                              <li>Near Sun: +2 points</li>
                              <li>Near Bee: Double base points</li>
                              <li>Near Tractor: +2 points</li>
                              <li>Same type adjacent: +1 point</li>
                            </>
                          )}
                          {cardDetail.type === "animal" && (
                            <>
                              <li>Near Barn: +4 points</li>
                              <li>Near Fence: +2 points</li>
                              <li>Near Tractor: +2 points</li>
                              <li>Same type adjacent: +1 point</li>
                            </>
                          )}
                          {cardDetail.type === "building" && (
                            <>
                              <li>Provides bonuses to adjacent cards</li>
                              <li>Near Tractor: +2 points</li>
                            </>
                          )}
                          {cardDetail.type === "special" && (
                            <>
                              {cardDetail.name === "Tractor" && (
                                <li>Gives +2 points to ALL adjacent tiles</li>
                              )}
                              {cardDetail.name === "Rain" && (
                                <li>Gives +2 points to adjacent crops</li>
                              )}
                              {cardDetail.name === "Sun" && (
                                <li>Gives +2 points to adjacent crops</li>
                              )}
                            </>
                          )}
                        </ul>
                      </div>
                      <div className="detail-strategy">
                        <strong>Strategy:</strong>
                        <p>{cardDetail.strategy}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="no-card-selected">
                      <p>👈 Click a card in your hand to see its details</p>
                    </div>
                  )}
                </div>

                {/* GRID ONLY (square) */}
                <div className="playing-field single">
                  <div className="grid-shell">
                    <div className="grid">
                      {grid.map((row, rowIndex) =>
                        row.map((cell, colIndex) => {
                          const highlightKey = `${rowIndex}-${colIndex}`;
                          const highlight = synergyHighlights[highlightKey];
                          const isSelectedForMove =
                            cardToMove &&
                            cardToMove[0] === rowIndex &&
                            cardToMove[1] === colIndex;

                          return (
                            <div
                              key={`${rowIndex}-${colIndex}`}
                              className={`grid-cell ${
                                cell ? "filled" : "empty"
                              } ${
                                selectedCard &&
                                grid[rowIndex][colIndex] === null &&
                                !gameEnded
                                  ? "hoverable"
                                  : ""
                              } ${gameEnded ? "disabled" : ""} ${
                                highlight ? "synergy-boost" : ""
                              } ${
                                isSelectedForMove ? "selected-for-move" : ""
                              } ${
                                shovelMode && !cardToMove && cell
                                  ? "shovel-selectable"
                                  : ""
                              }`}
                              onClick={() =>
                                handleGridCellClick(rowIndex, colIndex)
                              }
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
                              style={
                                cell ? { backgroundColor: cell.color } : {}
                              }
                            >
                              {cell && (
                                <div className="cell-content">
                                  <div className="cell-emoji">{cell.emoji}</div>
                                  <div className="cell-name">{cell.name}</div>
                                  <div className="cell-points">
                                    +{cell.points}
                                  </div>
                                  {cell.synergies &&
                                    cell.synergies.length > 0 && (
                                      <div className="cell-synergy">✨</div>
                                    )}
                                  {highlight && (
                                    <div className="synergy-indicator">
                                      +{highlight.bonus}
                                    </div>
                                  )}
                                </div>
                              )}
                              {isSelectedForMove && (
                                <div className="move-indicator">
                                  Move Here →
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="controls">
                <button onClick={startNewGame} className="control-btn">
                  New Game
                </button>
                <button
                  onClick={submitScore}
                  className="control-btn"
                  disabled={score === 0 || gameEnded}
                >
                  Submit Score
                </button>
                <button
                  onClick={() => setShowMultiplayerModal(true)}
                  className="control-btn"
                  disabled={gameEnded}
                >
                  Multiplayer
                </button>
                {shovelMode && (
                  <button
                    onClick={() => {
                      setShovelMode(false);
                      setCardToMove(null);
                    }}
                    className="control-btn cancel-btn"
                  >
                    Cancel Move
                  </button>
                )}
              </div>
            </>
          )}

          {activeTab === "leaderboard" && (
            <div className="leaderboard">
              <h3>🏆 Leaderboard</h3>
              <div className="leaderboard-list">
                {leaderboard.length === 0 ? (
                  <p>No scores yet. Be the first!</p>
                ) : (
                  leaderboard.map((entry, index) => (
                    <div key={entry.id} className="leaderboard-item">
                      <span className="rank">#{index + 1}</span>
                      <span className="name">{entry.playerName}</span>
                      <span className="score-value">{entry.score} pts</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {showMultiplayerModal && (
            <div
              className="modal-overlay"
              onClick={() => setShowMultiplayerModal(false)}
            >
              <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <h2>Multiplayer</h2>
                <div className="multiplayer-options">
                  <div className="create-game">
                    <h3>Create Game</h3>
                    <button
                      onClick={createMultiplayerGame}
                      className="control-btn"
                    >
                      Create New Game
                    </button>
                    {gameCode && (
                      <div className="game-code-result">
                        <p>Share this code:</p>
                        <div className="code-display">{gameCode}</div>
                      </div>
                    )}
                  </div>
                  <div className="join-game">
                    <h3>Join Game</h3>
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) =>
                        setJoinCode(e.target.value.toUpperCase())
                      }
                      placeholder="Enter game code"
                      maxLength={6}
                      className="code-input"
                    />
                    <button
                      onClick={joinMultiplayerGame}
                      className="control-btn"
                      disabled={!joinCode.trim()}
                    >
                      Join Game
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowMultiplayerModal(false)}
                  className="close-btn"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Dictionary Button */}
          <button
            className="dictionary-btn"
            onClick={() => setShowDictionary(true)}
          >
            📖 Dictionary
          </button>

          {/* Dictionary Modal */}
          {showDictionary && (
            <div
              className="modal-overlay"
              onClick={() => setShowDictionary(false)}
            >
              <div
                className="dictionary-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="dictionary-header">
                  <h2>📖 Card Dictionary</h2>
                  <button
                    className="close-btn"
                    onClick={() => setShowDictionary(false)}
                  >
                    ✕
                  </button>
                </div>
                <div className="dictionary-content">
                  {Object.entries(CARD_TYPES).map(([key, card]) => (
                    <div key={key} className="dictionary-card">
                      <div className="dict-card-header">
                        <span className="dict-emoji">{card.emoji}</span>
                        <span className="dict-name">{card.name}</span>
                        <span className="dict-type">{card.type}</span>
                        <span className="dict-points">
                          {card.basePoints} pts
                        </span>
                      </div>
                      <div className="dict-description">{card.description}</div>
                      {card.ability && (
                        <div className="dict-ability">
                          <strong>Special Ability:</strong>{" "}
                          {card.ability === CARD_ABILITIES.CLEAR_RANDOM
                            ? "Clears a random tile when placed"
                            : card.ability === CARD_ABILITIES.DOUBLE_ADJACENT
                            ? "Doubles points of adjacent crops"
                            : card.ability === CARD_ABILITIES.DOUBLE_POINTS
                            ? "Doubles its own points when placed"
                            : card.ability === CARD_ABILITIES.SWAP_MOVE
                            ? "Click to select a card to move, then click destination"
                            : card.ability === CARD_ABILITIES.GLOBAL_CROP_BOOST
                            ? "Gives +2 to every crop on the board"
                            : card.ability === CARD_ABILITIES.GLOBAL_AURA
                            ? "Gives +2 to every placed card"
                            : card.ability}
                        </div>
                      )}
                      <div className="dict-synergies">
                        <strong>Synergies:</strong>
                        <ul>
                          {card.type === "crop" && (
                            <>
                              <li>Near Mill: +3 points</li>
                              <li>Near Well: +2 points</li>
                              <li>Near Rain: +2 points</li>
                              <li>Near Sun: +2 points</li>
                              <li>Near Bee: Double base points</li>
                              <li>Near Tractor: +2 points</li>
                              <li>Same type adjacent: +1 point</li>
                            </>
                          )}
                          {card.type === "animal" && (
                            <>
                              <li>Near Barn: +4 points</li>
                              <li>Near Fence: +2 points</li>
                              <li>Near Tractor: +2 points</li>
                              <li>Same type adjacent: +1 point</li>
                            </>
                          )}
                          {card.type === "building" && (
                            <>
                              <li>Provides bonuses to adjacent cards</li>
                              <li>Near Tractor: +2 points</li>
                            </>
                          )}
                          {card.type === "special" && (
                            <>
                              {card.name === "Tractor" && (
                                <li>Gives +2 points to ALL adjacent tiles</li>
                              )}
                              {card.name === "Rain" && (
                                <li>Gives +2 points to adjacent crops</li>
                              )}
                              {card.name === "Sun" && (
                                <li>Gives +2 points to adjacent crops</li>
                              )}
                            </>
                          )}
                        </ul>
                      </div>
                      <div className="dict-strategy">
                        <strong>Strategy:</strong> {card.strategy}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
