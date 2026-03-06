import { useState, useEffect } from "react";

const JOKES = [
  { setup: "Why don't scientists trust atoms?", punchline: "Because they make up everything." },
  { setup: "Why did the scarecrow win an award?", punchline: "He was outstanding in his field." },
  { setup: "What do you call a fish without eyes?", punchline: "A fsh." },
  { setup: "Why can't you give Elsa a balloon?", punchline: "Because she'll let it go." },
  { setup: "What do you call cheese that isn't yours?", punchline: "Nacho cheese." },
  { setup: "Why did the bicycle fall over?", punchline: "Because it was two-tired." },
  { setup: "What do you get when you cross a snowman and a vampire?", punchline: "Frostbite." },
  { setup: "Why did the math book look so sad?", punchline: "Because it had too many problems." },
  { setup: "What do you call a sleeping dinosaur?", punchline: "A dino-snore." },
  { setup: "Why can't Elsa have a balloon?", punchline: "She'll let it go." },
  { setup: "What do you call a fake noodle?", punchline: "An Impasta." },
  { setup: "Why did the golfer bring an extra pair of socks?", punchline: "In case he got a hole in one." },
  { setup: "What do you call a bear with no teeth?", punchline: "A gummy bear." },
  { setup: "What did the ocean say to the beach?", punchline: "Nothing, it just waved." },
  { setup: "Why do cows wear bells?", punchline: "Because their horns don't work." },
  { setup: "What do elves learn in school?", punchline: "The elf-abet." },
  { setup: "Why did the tomato turn red?", punchline: "Because it saw the salad dressing." },
  { setup: "What did one hat say to the other?", punchline: "You stay here. I'll go on ahead." },
  { setup: "What do you call a dinosaur that crashes their car?", punchline: "Tyrannosaurus wrecks." },
  { setup: "Why are ghosts bad liars?", punchline: "Because you can see right through them." },
  { setup: "How do you organize a space party?", punchline: "You planet." },
  { setup: "Why did the stadium get hot after the game?", punchline: "All the fans left." },
  { setup: "What do you call a pony with a cough?", punchline: "A little hoarse." },
  { setup: "What's a vampire's favorite fruit?", punchline: "A blood orange." },
  { setup: "Why can't a leopard hide?", punchline: "Because he's always spotted." },
  { setup: "What do you call a pile of cats?", punchline: "A meowtain." },
  { setup: "Why did the cookie go to the doctor?", punchline: "Because it felt crummy." },
  { setup: "What do you call an alligator in a vest?", punchline: "An investigator." },
  { setup: "Why don't eggs tell jokes?", punchline: "They'd crack each other up." },
  { setup: "What do you call a snowman with a six-pack?", punchline: "An abdominal snowman." },
];

export default function NewsJokesWidget() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * JOKES.length));
  const [revealed, setRevealed] = useState(false);

  function nextJoke() {
    setIdx(i => (i + 1) % JOKES.length);
    setRevealed(false);
  }

  const joke = JOKES[idx];

  return (
    <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4">
      <div className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-3">😄 Citizen Corner — Daily Joke</div>
      <p className="text-sm text-slate-300 mb-2 leading-relaxed">{joke.setup}</p>
      {revealed ? (
        <p className="text-sm text-yellow-300 font-semibold italic mb-3">{joke.punchline}</p>
      ) : (
        <button
          onClick={() => setRevealed(true)}
          className="text-xs text-yellow-500 hover:text-yellow-300 underline mb-3 block transition-colors"
        >
          Reveal punchline...
        </button>
      )}
      <button
        onClick={nextJoke}
        className="w-full py-1.5 rounded-xl text-xs font-bold border border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/10 transition-all"
      >
        Next Joke →
      </button>
    </div>
  );
}