import { WebSocket } from "ws";
import { Chess } from "chess.js";
import { GAME_OVER, INIT_GAME, MOVE } from "./messages";

interface Move {
  from: string;
  to: string;
}

export class Game {
  public player1: WebSocket;
  public player2: WebSocket;
  public board: Chess; // main the moves and the board from a library
  private startTime: Date;
  private moveCount = 0; // maintaining the count

  constructor(player1: WebSocket, player2: WebSocket) {
    this.player1 = player1;
    this.player2 = player2;
    this.board = new Chess();
    this.startTime = new Date();

    // let the players know that the game has started and who is white and black
    this.player1.send(
      JSON.stringify({
        type: INIT_GAME,
        payload: {
          color: "white",
        },
      })
    );
    this.player2.send(
      JSON.stringify({
        type: INIT_GAME,
        payload: {
          color: "black",
        },
      })
    );
  }

  makeMove(socket: WebSocket, move: Move) {
    console.log("inside the make move");
    // validate the type of move using zod
    if (this.moveCount % 2 === 0 && socket !== this.player1) {
      return;
    }
    if (this.moveCount % 2 === 1 && socket !== this.player2) {
      return;
    }

    console.log("doesn't early return ");
    //  the following checks for invalid moves
    try {
      this.board.move(move);
    } catch (error) {
      console.log(error);
      return;
    }

    console.log("is a valid move");

    // check if the game is over
    if (this.board.isCheckmate()) {
      // send this to both the parties
      const gameOverMsg = JSON.stringify({
        type: GAME_OVER,
        payload: {
          winner: this.board.turn() === "w" ? "black" : "white",
        },
      });

      this.player1.send(gameOverMsg);
      this.player2.send(gameOverMsg);

      return;
    }

    // make the other player know that its your move now
    if (this.moveCount % 2 === 0) {
      console.log("send2");
      this.player2.send(
        JSON.stringify({
          type: MOVE,
          payload: move,
        })
      );
    } else {
      console.log("send 1");
      this.player1.send(
        JSON.stringify({
          type: MOVE,
          payload: move,
        })
      );
    }

    this.moveCount++;
  }
}
