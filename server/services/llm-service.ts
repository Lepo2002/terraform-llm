import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export class LLMService {
  async generateProjectStructure(projectType: string, config: any): Promise<{ files: Array<{ path: string; type: string }> }> {
    const prompt = `Generate a complete project structure for a ${projectType} application with the following configuration:
${JSON.stringify(config, null, 2)}

Return a JSON object with a "files" array, where each file has "path" and "type" properties.
Include all necessary files for a production-ready application.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || '{"files": []}');
  }

  async generateFileContent(filePath: string, fileType: string, projectType: string, config: any): Promise<string> {
    const prompt = `Generate the complete content for a file at "${filePath}" of type "${fileType}" for a ${projectType} project.

Project configuration:
${JSON.stringify(config, null, 2)}

The file should be production-ready, follow best practices, and include:
- Proper error handling
- Documentation/comments
- Type safety where applicable
- Security considerations

Return only the file content, no explanations.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content || '';
  }

  async generateTerraformConfig(cloudProvider: string, environment: string, config: any): Promise<{ [filename: string]: string }> {
    const prompt = `Generate complete Terraform configuration files for deploying a ${config.projectType} application on ${cloudProvider} in the ${environment} environment.

Configuration:
${JSON.stringify(config, null, 2)}

Return a JSON object where keys are filenames and values are the file contents.
Include: main.tf, variables.tf, outputs.tf, and provider.tf files.
Follow Terraform best practices and include proper resource naming and tagging.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  async analyzeCode(content: string, filePath: string): Promise<{ summary: string; issues: string[]; suggestions: string[] }> {
    const prompt = `Analyze the following code from "${filePath}":

\`\`\`
${content}
\`\`\`

Return a JSON object with:
- summary: Brief description of what the code does
- issues: Array of potential problems or code smells
- suggestions: Array of improvement recommendations`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || '{"summary": "", "issues": [], "suggestions": []}');
  }

  async generateTests(sourceContent: string, sourceFile: string): Promise<string> {
    const prompt = `Generate comprehensive unit tests for the following code from "${sourceFile}":

\`\`\`
${sourceContent}
\`\`\`

Generate tests that:
- Cover all functions/methods
- Include edge cases and error scenarios
- Follow testing best practices for the language
- Include proper test setup and teardown

Return only the test code.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content || '';
  }

  async analyzeCommit(commit: any, diff: string): Promise<{ type: string; impact: string; patterns: string[] }> {
    const prompt = `Analyze this git commit:

Message: ${commit.message}
Author: ${commit.author}
Date: ${commit.date}

Diff:
\`\`\`
${diff}
\`\`\`

Return a JSON object with:
- type: The type of change (feature, bugfix, refactor, etc.)
- impact: Assessment of the change's impact (low, medium, high)
- patterns: Array of coding patterns or practices observed`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || '{"type": "unknown", "impact": "low", "patterns": []}');
  }

  async extractLearningInsights(analyses: any[]): Promise<{ patterns: string[]; style: any }> {
    const prompt = `Extract learning insights from these commit analyses:

${JSON.stringify(analyses, null, 2)}

Return a JSON object with:
- patterns: Array of recurring development patterns
- style: Object describing the coding style preferences`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || '{"patterns": [], "style": {}}');
  }

  async identifyMetaPatterns(patterns: string[]): Promise<string[]> {
    const prompt = `Identify meta-patterns from these development patterns:

${JSON.stringify(patterns, null, 2)}

Return a JSON object with a "metaPatterns" array of higher-level patterns that emerge from the data.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"metaPatterns": []}');
    return result.metaPatterns;
  }

  async generateRecommendations(metaPatterns: string[]): Promise<string[]> {
    const prompt = `Generate actionable recommendations based on these meta-patterns:

${JSON.stringify(metaPatterns, null, 2)}

Return a JSON object with a "recommendations" array of specific improvements.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"recommendations": []}');
    return result.recommendations;
  }

  async generateImprovementSuggestions(knowledge: any): Promise<string[]> {
    const prompt = `Generate improvement suggestions based on this project knowledge:

${JSON.stringify(knowledge, null, 2)}

Return a JSON object with a "suggestions" array of specific improvements for the project.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"suggestions": []}');
    return result.suggestions;
  }

  async analyzeCodebase(codebase: string, metadata: any): Promise<{ patterns: string[] }> {
    const prompt = `Analyze this codebase and extract development patterns:

Metadata: ${JSON.stringify(metadata, null, 2)}

Codebase content:
\`\`\`
${codebase}
\`\`\`

Return a JSON object with a "patterns" array of identified patterns.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || '{"patterns": []}');
  }
}
