const Testimonial = require('../models/Testimonial');

async function ensureDefaultTestimonials() {
  const defaults = [
    {
      name: 'Rajesh Kumar',
      feedback: 'Great service and quality products. Highly recommended!',
      rating: 5,
      status: 'active',
    },
    {
      name: 'Priya Sharma',
      feedback: 'Excellent customer support and fast delivery.',
      rating: 5,
      status: 'active',
    },
    {
      name: 'Anita Patel',
      feedback:
        'Solar insect traps significantly reduced pests in my vegetable farm without using pesticides.',
      rating: 5,
      status: 'active',
    },
    {
      name: 'Mahesh Yadav',
      feedback:
        'Lure traps helped us monitor and control fruit fly with minimal chemicals. Very effective!',
      rating: 4,
      status: 'active',
    },
    {
      name: 'Sneha Deshmukh',
      feedback:
        'Plasma‑treated water improved seed germination in our nursery. Impressed with the results.',
      rating: 5,
      status: 'active',
    },
    {
      name: 'Harish Mehta',
      feedback:
        'Honest guidance and quick delivery. Sustainable solutions that actually work in the field.',
      rating: 5,
      status: 'active',
    },
  ];

  try {
    for (const t of defaults) {
      const exists = await Testimonial.findOne({ name: t.name });
      if (!exists) {
        await new Testimonial(t).save();
        console.log(`✅ Ensured testimonial: ${t.name}`);
      }
    }
  } catch (e) {
    console.warn('⚠️ Could not ensure default testimonials:', e.message);
  }
}

module.exports = { ensureDefaultTestimonials };
