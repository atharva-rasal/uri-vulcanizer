import { PrismaClient, Recipe } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Recipe Scheduler Service
 * Monitors pending recipes and activates them at scheduled time
 */
export class RecipeScheduler {
  private interval: NodeJS.Timeout | null = null;

  start(checkIntervalMs: number = 10000) {
    console.log(`[Scheduler] Started with ${checkIntervalMs}ms interval`);

    this.interval = setInterval(async () => {
      await this.checkAndActivateRecipes();
    }, checkIntervalMs);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log("[Scheduler] Stopped");
    }
  }

  /**
   * Check for pending recipes that should be activated
   */
  private async checkAndActivateRecipes() {
    try {
      const now = new Date();

      // Find all pending recipes with scheduledAt <= now
      const pendingRecipes = await prisma.recipe.findMany({
        where: {
          status: "pending",
          scheduledAt: {
            lte: now,
            not: null,
          },
        },
      });

      for (const recipe of pendingRecipes) {
        await this.activateRecipe(recipe);
      }
    } catch (error) {
      console.error("[Scheduler] Error checking recipes:", error);
    }
  }

  /**
   * Activate a recipe by updating its status and logging the action
   */
  private async activateRecipe(recipe: Recipe) {
    try {
      console.log(
        `[Scheduler] Activating recipe: ${recipe.name} (ID: ${recipe.id})`
      );

      // Update recipe status to activated
      const updated = await prisma.recipe.update({
        where: { id: recipe.id },
        data: { status: "activated" },
      });

      // Create a changelog entry for the activation
      await prisma.changeLog.create({
        data: {
          user: "System (Scheduler)",
          action: "recipe-activated",
          details: {
            recipeId: recipe.id,
            recipeName: recipe.name,
            activatedAt: new Date().toISOString(),
            parameters: {
              curingTemp: recipe.curingTemp,
              tempBandPlus: recipe.tempBandPlus,
              tempBandMinus: recipe.tempBandMinus,
              pressure: recipe.pressure,
              pressureBandPlus: recipe.pressureBandPlus,
              pressureBandMinus: recipe.pressureBandMinus,
              curingTime: recipe.curingTime,
              exhaustDelay: recipe.exhaustDelay,
              purgingCycles: recipe.purgingCycles,
            },
          },
        },
      });

      // TODO: Send recipe parameters to PLC here
      // Example:
      // await plcService.sendRecipe(recipe);

      console.log(`[Scheduler] ✓ Recipe ${recipe.name} activated successfully`);
    } catch (error) {
      console.error(`[Scheduler] Error activating recipe ${recipe.id}:`, error);

      // Log the failure
      await prisma.changeLog.create({
        data: {
          user: "System (Scheduler)",
          action: "recipe-activation-failed",
          details: {
            recipeId: recipe.id,
            recipeName: recipe.name,
            error: error instanceof Error ? error.message : String(error),
          },
        },
      });
    }
  }

  /**
   * Manually activate a recipe (for immediate use)
   */
  async manuallyActivateRecipe(recipeId: number) {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe) {
      throw new Error(`Recipe ${recipeId} not found`);
    }

    await this.activateRecipe(recipe);
  }
}

// Export singleton instance
export const recipeScheduler = new RecipeScheduler();
