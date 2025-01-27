import Together from "together-ai";

import { useDrizzle, resetDb, eq, sql } from "~/server/utils/drizzle";
import { items, recipes } from "~/server/database/schema";

const prompts = {
  different: `
# Game Concept
You are an advanced AI that powers an endless alchemy game. Your goal is to give the user a new, slightly more complex element by combining two existing elements.

# Rules (order does not matter)
- You should only output the result of the given combination, no explanation or parenthesized explanation. Also, no repeating the combination and then outputting the result.
- The result must be logical, so never concatenate the two words that have similar meaning or are the same as the elements the user gave.
- Never say that the given items are invalid because anything can be created from just the basic elements.
- The result can be:
-- a combination of the elements like Fire + Water = Steam
-- the thing, person or creature that is considered the {first element} of the {second element} (or {second element} of the {first element}) like Ocean + King = Poseidon
- The result should be non-fictional unless the combination hints or references a fictional result.
- If the items are early-game items, you should not use complex words that the user might not understand.

# Input format
{element A} + {element B} =

# Output format
{result element}

# What to do (if one of these are shown, you must give the result from here)
Fire + Water = Steam
Earth + Rain = Plant
Cloud + Fire = Lightning
King + Ocean = Poseidon
  `,
  same: `
# Game Concept
You are an advanced AI that powers a game where the user can start from one element, then merge with itself to get another element.

# Rules (order does not matter)
- You should only output the result of the given combination, no explanation or parenthesized explanation. Also, no repeating the combination and then outputting the result.
- Never say that the given item is invalid because anything can be created from just the basic elements.
- The result should be either a larger, better, or the multiple version of the item. If it doesn't make sense to be combined twice using the mentioned methods, just output the given item.
- If the item is an early-game item, you should not use complex words that the user might not understand.

# Input format
{element A} + {element A} =

# Output format
{result element}

# Examples (if one of these are shown, you give the result from here, if not, you take inspiration from these)
Water + Water = Lake
Earth + Earth = Mountain
Rock + Rock = Boulder
Plant + Plant = Tree
  `,
  details: `
You are an advanced AI that creates emojis and descriptions based on the given item.

# Rules (order does not matter)
- The description shouldn't be fictional if the item also isn't.
- If the item has multiple meanings, choose the one that suits an alchemy game most.
- Any item can be used, so no outputting "Invalid item".
- The description must not contain the item name, any synonyms, or any references to a combination for the item.
- The description should start with "A", "An", or "The" if the item is a singular noun.
- The description should be specific to the item, not something general.
- The description should be 25 words maximum, with 10-15 words being the recommended length.
- The emoji should be 1 character unless there needs to be more, but the maximum is 3 characters.
- The emoji and description must be separated by a newline.

# Input format
\`\`\`
{item name}
\`\`\`

# Output format
{emoji}
{description}

# Example emojis
Steam: 💨
Cloud: ☁️
Sand: 🏖️
Dust: 🌫️
{nonsensical items}: 🤔 or ❓

# Example descriptions
JavaScript: A programming language that is most primarily used for web development.
Poseidon: The god of the sea in Greek mythology.
  `,
};

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  try {
    const elA = body.recipe.sort()[0];
    const elB = body.recipe.sort()[1];

    const db = useDrizzle();

    const baseElements = await db
      .select()
      .from(items)
      .where(
        sql`${items.text} = 'Water' or ${items.text} = 'Fire' or ${items.text} = 'Earth' or ${items.text} = 'Air'`,
      );

    if (baseElements.length < 4) {
      await resetDb();
    }

    const legitimateItems = await db
      .select()
      .from(items)
      .where(sql`${items.text} = ${elA} or ${items.text} = ${elB}`);

    if (
      legitimateItems.length < 2 &&
      !(elA === elB && legitimateItems.length === 1)
    ) {
      console.log("Cheater!");
      throw new Error("An item does not exist");
    }

    const existingRecipe = await db
      .select()
      .from(recipes)
      .where(and(eq(recipes.a, elA), eq(recipes.b, elB)));

    if (existingRecipe.length > 0) {
      const resultText = existingRecipe[0].result;
      const matching = (
        await db.select().from(items).where(eq(items.text, resultText))
      )[0];

      if (matching) {
        console.log("Recipe already exists");
        return {
          text: matching.text,
          emoji: matching.emoji,
          description: matching.description,
          discovered: false,
        };
      } else {
        throw new Error("Recipe exists but item not found");
      }
    }

    const together = new Together({ apiKey: process.env.TOGETHER_API_KEY });

    const textCompletion = await together.chat.completions.create({
      model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
      messages: [
        {
          role: "system",
          content: prompts[elA === elB ? "same" : "different"],
        },
        {
          role: "user",
          content: `${elA} + ${elB} =`,
        },
      ],
      temperature: 0,
      top_p: 0,
      top_k: 100,
      max_tokens: 35,
      stop: ["\n", "=", "```"],
    });

    const resultText = textCompletion.choices[0].message?.content || "";

    if (!resultText || resultText === "SPECIAL::ERR") {
      throw new Error("No result");
    }

    const matching = (
      await db.select().from(items).where(eq(items.text, resultText))
    )[0];

    if (matching) {
      console.log("Matching item exists");

      await db
        .insert(recipes)
        .values({ a: elA, b: elB, result: resultText })
        .onConflictDoNothing();

      return {
        text: matching.text,
        emoji: matching.emoji,
        description: matching.description,
        discovered: false,
      };
    }

    const detailsCompletion = await together.chat.completions.create({
      model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
      messages: [
        {
          role: "system",
          content: prompts["details"],
        },
        {
          role: "user",
          content: `
          \`\`\`
          ${resultText}
          \`\`\`
          `,
        },
      ],
      temperature: 0,
      top_p: 0,
      top_k: 100,
      max_tokens: 128,
    });

    const resultEmoji =
      detailsCompletion.choices[0].message?.content?.split("\n")[0] || "";
    const resultDescription =
      detailsCompletion.choices[0].message?.content?.split("\n")[1] || "";

    const existingRecipe2 = await db
      .select()
      .from(recipes)
      .where(and(eq(recipes.a, elA), eq(recipes.b, elB)));

    if (existingRecipe2.length > 0) {
      const resultText = existingRecipe2[0].result;
      const matching = (
        await db.select().from(items).where(eq(items.text, resultText))
      )[0];

      if (matching) {
        console.log("Recipe already exists");
        return {
          text: matching.text,
          emoji: matching.emoji,
          description: matching.description,
          discovered: false,
        };
      } else {
        throw new Error("Recipe exists but item not found");
      }
    }

    const newElement = {
      text: resultText,
      emoji: resultDescription ? resultEmoji : "",
      description: resultDescription,
      discovered: true,
    };

    await db
      .insert(items)
      .values({
        text: newElement.text,
        emoji: newElement.emoji,
        description: newElement.description,
      })
      .onConflictDoNothing();

    await db
      .insert(recipes)
      .values({ a: elA, b: elB, result: resultText })
      .onConflictDoNothing();

    return newElement;
  } catch {
    return {
      text: "SPECIAL::ERR",
      emoji: "❌",
      description: "The error item.",
      discovered: false,
    };
  }
});
