# Luzifer / stadt-land-fluss

"Stadt-Land-Fluss" is a quite simple implementation of the German version of the "Categories" game known in the English domain to be played over the internet with all parties playing being able to see the answers of the others as soon as they've sent their own answer.

This project emerged from a rehab task to improve the ability to remember words: Try to remember the things mentioned with the given letter at its beginning and let others give you hints if nothing comes to your mind.

## How to play

You can just go to the [Github page for this repo](https://luzifer.github.io/stadt-land-fluss/) and you get a game opened (at the moment with German interface and categories, see below). Just share the URL in your browsers location bar with all other participants and they will enter the same game.

- Edit your name in the top of the page (will be stored in local storage)
- Enter the answer for the letter / category combination into the field and press enter / click the button to submit
- If you can't answer the field, just press enter or click the "skip" button and your answer will be shown as skipped to the others
- As soon as you've submitted your answer you'll see the answers of your mates
- When you're done with the row, click the "+" in the upper left to get a new letter and repeat
- As soon as you've reached 26 rows you need a new game (button in the top) which will give you a new URL with new categories

## Dependencies / Development

The only dependency aside of a place to host the files is a websocket server to multiplex the messages between the participants. The hosted instance in Github pages relies on my [ws-relay](https://github.com/Luzifer/ws-relay) hosted on my infrastructure. When deploying your own instance of the game please exchange that websocket URL.

To make changes / deploy your own version

- find the code in the `src` folder
- modify stuff (including the ws-relay URL template in the `config.ts`)
- `make frontend` to build the game into the `dist` folder
- put the contents of the `dist` folder somewhere public
- play your own version

## Open task

See [enhancement](https://github.com/Luzifer/stadt-land-fluss/labels/enhancement) issues.
