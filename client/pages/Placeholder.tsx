import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Hammer, ArrowLeft } from "lucide-react";

interface PlaceholderProps {
  title: string;
  description: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderProps) {
  return (
    <Layout>
      <div className="container min-h-[70vh] flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-primary/10 p-6 rounded-full">
          <Hammer className="h-12 w-12 text-primary animate-bounce" />
        </div>
        <div className="space-y-2 max-w-lg">
          <h1 className="text-4xl font-extrabold tracking-tight">{title}</h1>
          <p className="text-xl text-muted-foreground">
            {description}
          </p>
          <p className="text-sm text-muted-foreground pt-4 italic">
            "FUTA is not flat. It is vertical storytelling. You need intelligence, not guesswork."
          </p>
        </div>
        <div className="flex gap-4">
          <Link to="/">
            <Button variant="outline" className="gap-2 rounded-xl">
              <ArrowLeft className="h-4 w-4" />
              Back Home
            </Button>
          </Link>
          <Link to="/map">
            <Button className="rounded-xl">Explore Map Instead</Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
