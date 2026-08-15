import { skills } from "@/lib/content";
import { Chip } from "./primitives";
import { Reveal } from "./Reveal";

// Bento spans on a 6-column grid — wide cards for the dense groups.
const spans = [
  "sm:col-span-3",
  "sm:col-span-3",
  "sm:col-span-4",
  "sm:col-span-2",
  "sm:col-span-3",
  "sm:col-span-3",
];

export function Skills() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
      {skills.map((group, index) => (
        <Reveal
          key={group.group}
          delay={index * 50}
          className={spans[index] ?? "sm:col-span-2"}
        >
          <div className="card card-hover h-full p-5">
            <h3 className="font-mono text-[10px] tracking-[0.2em] text-fg-subtle uppercase">
              {group.group}
            </h3>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {group.items.map((item) => (
                <Chip key={item}>{item}</Chip>
              ))}
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
