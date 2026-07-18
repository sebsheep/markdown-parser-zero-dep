/**
 * This test is used to test the markdown parser with random strings.
 * It is mainly used to find inputs that make the parser loop forever.
 * That's why the input is written on the console before running the parser,
 * so that we can kill the process and know which input is causing the loop.
 */
import { parseMarkdown } from "../src/parser.ts";

const symbols = [
  ..." aZ0123456789!@#$%^&*()_+-=[]{}`|;:,.<>?\n\t\r".split(""),
  "\n\n",
  "\n  ",
  "\n   ",
  "\n    ",
  "\n     ",
  "\n      ",
  "\n  * ",
  "\n   * ",
  "\n    * ",
  "\n     * ",
  "\n      * ",
  "**",
  "# ",
  "__",
  "---",
  "\n---\n",
];

const generateRandomString = () => {
  let result = "";
  for (let i = 0; i < Math.floor(Math.random() * 50000); i++) {
    result += symbols[Math.floor(Math.random() * symbols.length)];
  }
  return result;
};

const times: number[] = [];
for (let i = 0; i < 1000; i++) {
  const string = generateRandomString();
  console.log(`Iteration ${i}: ${string}`);
  const start = performance.now();
  parseMarkdown(string);
  times.push(performance.now() - start);
  console.log("--------------------------------");
}

console.log("Maximums (ms):", times.toSorted((a, b) => b - a).slice(0, 4));
console.log("Minimum (ms):", times.reduce((a, b) => Math.min(a, b), Infinity));
const average = times.reduce((a, b) => a + b, 0) / times.length;
console.log("Average (ms):", average);

if (average > 0.3) {
  console.warn("Average looks high, check the parser performance");
}
// Previous run results (Seb's computer):
// Maximums (ms): [
//   8.957598000000019,
//   2.7261310000000094,
//   2.6259300000000394,
//   2.1806270000000154
// ]
// Minimum (ms): 0.0011700000000018917
// Average (ms): 0.11968909600000044
