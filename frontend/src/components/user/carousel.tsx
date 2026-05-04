import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export function CarouselSize() {
  function randomize() {
    const random: number = Math.floor(Math.random() * 8) + 1;

    switch (random) {
      case 1:
        return "t";
      case 2:
        return "tr";
      case 3:
        return "tl";
      case 4:
        return "br";
      case 5:
        return "b";
      case 6:
        return "bl";
      case 7:
        return "r";
      case 8:
        return "l";
    }
  }

  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      className="w-full max-w-full"
    >
      <CarouselContent>
        {Array.from({ length: 24 }).map((_, index) => (
          <CarouselItem key={index} >
            <div className="p-4">
              <Card className={`bg-gradient-to-${randomize()} from-lime-100`} >
                <CardContent className="flex aspect-[16/9] items-center justify-center p-0 w-full max-h-[800px]">
                  <img
                    src={`/carousel/artcamp/${index + 1}.webp`}
                    alt={`carousel image ${index + 1}`}
                    className="object-cover object-[20%_20%] w-full h-full rounded-lg"
                  />
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
