import mongoose from 'mongoose';

const valueItemSchema = new mongoose.Schema(
  {
    icon: {
      type: String,
      default: 'Award', // 'Award', 'Compass', 'Heart', 'ShieldCheck', etc.
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: true }
);

const statItemSchema = new mongoose.Schema(
  {
    value: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: true }
);

const leaderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    designation: {
      type: String,
      required: true,
      trim: true,
    },
    tagline: {
      type: String,
      default: "FOUNDER'S PERSPECTIVE",
      trim: true,
    },
    heading: {
      type: String,
      default: 'A NOTE FROM FOUNDER',
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    paragraphs: [
      {
        type: String,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const additionalSectionSchema = new mongoose.Schema(
  {
    tagline: {
      type: String,
      default: '',
      trim: true,
    },
    heading: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true, timestamps: true }
);

const aboutPageSchema = new mongoose.Schema(
  {
    hero: {
      establishedYear: {
        type: String,
        default: 'ESTABLISHED 2026',
        trim: true,
      },
      titlePart1: {
        type: String,
        default: 'THE ART OF PURE',
        trim: true,
      },
      titleHighlight: {
        type: String,
        default: 'CURATION',
        trim: true,
      },
      subtitle: {
        type: String,
        default: "VAULT was founded on a simple principle: to engineer elite, premium men's essentials that stand the test of time. No shortcuts. No compromise. Just pure craftsmanship.",
        trim: true,
      },
    },
    story: {
      tagline: {
        type: String,
        default: 'OUR NARRATIVE',
        trim: true,
      },
      heading: {
        type: String,
        default: 'REDEFINING MODERN LUXURY',
        trim: true,
      },
      paragraphs: [
        {
          type: String,
          trim: true,
        },
      ],
      statsHeading: {
        type: String,
        default: 'VAULT AT A GLANCE',
        trim: true,
      },
      stats: [statItemSchema],
    },
    values: {
      tagline: {
        type: String,
        default: 'OUR GUIDING PRINCIPLES',
        trim: true,
      },
      heading: {
        type: String,
        default: 'THE PILLARS OF EXCELLENCE',
        trim: true,
      },
      items: [valueItemSchema],
    },
    founder: leaderSchema,
    coFounder: leaderSchema,
    additionalSections: [additionalSectionSchema],
  },
  { timestamps: true }
);

const AboutPage = mongoose.model('AboutPage', aboutPageSchema);
export default AboutPage;
