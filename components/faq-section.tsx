import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    question: "How quickly can we expect to see cost savings?",
    answer:
      "Most of our clients see tangible cost reductions within the first 30 days. The full 30-60% savings are typically realized within the first quarter as we implement and optimize our recommendations.",
  },
  {
    question: "Will this disrupt our current development workflow?",
    answer:
      "Absolutely not. Our process is designed to be non-disruptive. We work in parallel with your team, providing clear communication and integrating seamlessly with your existing tools and workflows.",
  },
  {
    question: "What if we already have a DevOps engineer?",
    answer:
      "Great! We love collaborating. We can augment your existing team, providing specialized expertise in areas like cost optimization or advanced SRE practices, freeing up your engineer to focus on product-centric tasks.",
  },
  {
    question: "What cloud platforms do you support?",
    answer:
      "We are experts in all major cloud platforms, including Amazon Web Services (AWS), Google Cloud Platform (GCP), and Microsoft Azure. Our principles of cost optimization and reliability apply across all providers.",
  },
]

export function FaqSection() {
  return (
    <section id="faq" className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Frequently Asked Questions</h2>
          <p className="mt-4 text-lg text-gray-400">Clear answers to your most pressing questions.</p>
        </div>
        <div className="mt-12 max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-lg font-semibold hover:text-cyan-400">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-400 text-base">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
