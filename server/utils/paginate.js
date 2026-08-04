import mongoose from 'mongoose';

/**
 * Reusable Mongoose aggregation pagination helper using $facet.
 * 
 * @param {mongoose.Model} model - The Mongoose model to query.
 * @param {Object} matchQuery - The filter match conditions.
 * @param {Object} sortOptions - The sort key/value options.
 * @param {number} pageNum - The page number requested.
 * @param {number} limitNum - The items limit per page.
 * @param {Array} lookupStages - Optional lookup/unwind stages for data populating.
 * @returns {Promise<Object>} Object containing data, page, pages, and total.
 */
export const paginateAggregate = async (model, matchQuery, sortOptions, pageNum, limitNum, lookupStages = []) => {
  const page = Math.max(1, Number(pageNum) || 1);
  const limit = Math.max(1, Number(limitNum) || 10);
  const skip = (page - 1) * limit;

  const pipeline = [
    { $match: matchQuery },
    {
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $sort: sortOptions },
          { $skip: skip },
          { $limit: limit },
          ...lookupStages
        ]
      }
    }
  ];

  const result = await model.aggregate(pipeline);
  const total = result[0]?.metadata[0]?.total || 0;
  const data = result[0]?.data || [];

  return {
    data,
    page,
    pages: Math.ceil(total / limit),
    total
  };
};
