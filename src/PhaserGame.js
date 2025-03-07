// PhaserGame.js
import React, { useRef, useEffect, useState } from 'react';
import Phaser from 'phaser';
import { getMap, maps } from './MapConfig';
import { createGameScene } from './GameScene';

function PhaserGame() {
  const gameRef = useRef(null);
  const gameInstance = useRef(null);
  const [gameState, setGameState] = useState({
    mapIndex: 0,
    gameOver: false,
    gameFinished: false,
    totalMaps: maps.length,
  });

  useEffect(() => {
    if (gameInstance.current) {
      gameInstance.current.destroy(true);
      gameInstance.current = null;
    }

    const currentMap = getMap(gameState.mapIndex);
    const tileSize = currentMap.tileSize;
    const config = {
      type: Phaser.AUTO,
      width: currentMap.width * tileSize,
      height: currentMap.height * tileSize,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: currentMap.width * tileSize,
        height: currentMap.height * tileSize,
      },
      parent: gameRef.current,
      physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: true },
      },
      audio: { disableWebAudio: true },
      input: { gamepad: true },
      scene: createGameScene(currentMap, gameState, setGameState),
    };

    gameInstance.current = new Phaser.Game(config);

    return () => {
      if (gameInstance.current) {
        gameInstance.current.destroy(true);
        gameInstance.current = null;
      }
    };
  }, [gameState.mapIndex, gameState.gameOver, gameState.gameFinished]); // Dependencies are specific fields

  const handleRestart = () => {
    setGameState({
      mapIndex: 0,
      gameOver: false,
      gameFinished: false,
      totalMaps: maps.length,
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#000',
      }}
    >
      <div
        ref={gameRef}
        style={{
          width: `${window.innerWidth * 0.8}px`,
          height: `${window.innerHeight * 0.8}px`,
          border: '1px solid red',
          position: 'relative',
        }}
      >
        {gameState.gameOver && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: 'white',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            <h1 style={{ fontSize: '48px', margin: '20px' }}>Game Over</h1>
            <button
              onClick={handleRestart}
              style={{
                padding: '10px 20px',
                fontSize: '24px',
                backgroundColor: '#ff4444',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              Reiniciar
            </button>
          </div>
        )}
        {gameState.gameFinished && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: 'white',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            <h1 style={{ fontSize: '48px', margin: '20px' }}>¡Juego Terminado!</h1>
            <button
              onClick={handleRestart}
              style={{
                padding: '10px 20px',
                fontSize: '24px',
                backgroundColor: '#44ff44',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              Reiniciar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PhaserGame;