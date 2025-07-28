"use client";

import { useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const starterCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Awesome Page</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            padding: 2rem;
            background-color: #ffffff;
            color: #1f2937;
        }
        h1 {
            color: #6A5ACD; /* Slate Blue */
        }
        p {
            max-width: 600px;
        }
        .highlight {
            background-color: #FF7F50; /* Coral */
            color: white;
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <h1>Welcome to Page Forge!</h1>
    <p>This is your canvas. Write or paste HTML in the editor on the left to see it rendered here in real-time.</p>
    <p>Try changing this text, or maybe add a <span class="highlight">highlight</span> to it!</p>
</body>
</html>`;

export default function Home() {
  const [htmlContent, setHtmlContent] = useState<string>(starterCode);

  const handleSave = () => {
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "page.html";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setHtmlContent("");
  };

  return (
    <main className="bg-background min-h-screen w-full flex flex-col p-4">
      <header className="text-center mb-6 flex-shrink-0">
        <h1 className="text-4xl lg:text-5xl font-bold font-headline text-primary">Page Forge</h1>
        <p className="text-muted-foreground mt-2">Your simple, real-time HTML editor and previewer.</p>
      </header>
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="font-headline">Editor</CardTitle>
              <CardDescription>Enter your code below.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handleClear} aria-label="Clear code">
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button size="icon" onClick={handleSave} aria-label="Save HTML file">
                <Save className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-grow p-0">
            <Textarea
              placeholder="Type your HTML here..."
              className="w-full h-full resize-none border-0 rounded-none focus-visible:ring-0 font-code text-sm p-4 bg-card"
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              aria-label="HTML Code Input"
            />
          </CardContent>
        </Card>
        
        <Card className="flex flex-col shadow-lg rounded-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="font-headline">Live Preview</CardTitle>
            <CardDescription>Your rendered HTML appears here.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow p-0 bg-white">
            <iframe
              srcDoc={htmlContent}
              title="HTML Preview"
              className="w-full h-full border-0"
              sandbox="allow-same-origin"
              key={Math.random()}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
