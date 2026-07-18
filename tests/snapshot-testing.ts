import fs from "node:fs";
import readline from "node:readline";

const readLineAsync = (message: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(message, (answer: string) => {
      resolve(answer);
      rl.close();
    });
  });
};

const askQuestion = async (
  message: string,
  options: string[],
): Promise<string> => {
  let answer = await readLineAsync(message);
  while (!options.includes(answer)) {
    answer = await readLineAsync(message);
  }
  return answer;
};

export type Snapshot = { only?: boolean; name: string; input: () => string };

export const runTests = async (tests: Snapshot[], outputFolder: string) => {
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  const duplicates = checkDuplicates(tests);

  if (duplicates.length > 0) {
    console.error("The following tests are define at least twice, clean it up");
    console.error(duplicates.map((d) => `  - ${d}`).join("\n"));
    return;
  }

  let testsToRun = tests.filter((t) => t.only);
  let partialTesting = true;
  if (testsToRun.length === 0) {
    testsToRun = tests;
    partialTesting = false;
  }

  const created: Created[] = [];
  const updated: Updated[] = [];
  let notChangedCount = 0;
  for (const test of testsToRun) {
    const result = test.input();
    const outputFile = `${outputFolder}/${test.name}.txt`;
    if (!fs.existsSync(outputFile)) {
      created.push({ name: test.name, result, outputFile });
    } else {
      const previous = fs.readFileSync(outputFile, "utf8");
      if (result !== previous) {
        updated.push({ name: test.name, previous, new: result, outputFile });
      } else {
        notChangedCount++;
      }
    }
  }

  await handleCreated(created);
  await handleUpdated(updated);
  console.log(`${notChangedCount} test(s) not changed`);

  if (partialTesting) {
    console.warn(
      "WARNING: only some tests were run. Remove the `only` attribute to all tests to run all tests",
    );
    process.exitCode = 1;
  }
};

type Created = { name: string; result: string; outputFile: string };
const handleCreated = async (created: Created[]) => {
  for (const test of created) {
    console.log(`${test.name} creation. Computed result:\n\n${test.result}`);
    const answer = await askQuestion("Do you accept this result? (y/n)", [
      "y",
      "n",
    ]);
    if (answer === "y") fs.writeFileSync(test.outputFile, test.result);
  }
};

type Updated = {
  name: string;
  previous: string;
  new: string;
  outputFile: string;
};
const handleUpdated = async (updated: Updated[]) => {
  for (const test of updated) {
    console.log(`${test.name} changed`);
    console.log("Previous:\n");
    console.log(test.previous);
    console.log("\nNew:\n");
    console.log(test.new);
    console.log();
    const answer = await askQuestion(
      "Do you want to update the snapshot? (y/n)",
      ["y", "n"],
    );
    if (answer === "y") fs.writeFileSync(test.outputFile, test.new);
  }
};

const checkDuplicates = (snapshots: Snapshot[]): string[] => {
  const alreadySeen = new Map<string, number>();

  for (const snapshot of snapshots) {
    alreadySeen.set(snapshot.name, (alreadySeen.get(snapshot.name) ?? 0) + 1);
  }
  return Array.from(alreadySeen.entries()).filter(([key, count]) =>
    count > 1,
  ).map(([key]) => key);
};
