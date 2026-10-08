const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const response = await notion.databases.query({
        database_id: databaseId,
        sorts: [{ property: '날짜', direction: 'descending' }],
        page_size: 100,
      });

      const results = response.results.map((page) => {
        const props = page.properties;
        return {
          id: page.id,
          cause: props['발생 원인']?.title[0]?.plain_text || '내용 없음',
          type: props['유형']?.select?.name || '',
          line: props['발생 라인']?.select?.name || '',
          action: props['조치 결과']?.select?.name || '',
          qty: props['수량']?.number || 0,
          date: props['날짜']?.date?.start || '',
        };
      });
      return res.status(200).json(results);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { type, line, cause, action, qty, date, productName, orderNo, qtOn } = req.body;
      const response = await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
          '제품명': { title: [{ text: { content: productName || '이름 없음' } }] },
          '지시번호': { rich_text: [{ text: { content: orderNo || '-' } }] },
          'QT ON': { rich_text: [{ text: { content: qtOn || '-' } }] },
          '내용': { rich_text: [{ text: { content: cause || '내용 없음' } }] },
          '유형': { select: { name: type || '품질불량' } },
          '발생 라인': { select: { name: line || '-' } },
          '조치결과': { select: { name: action || '-' } },
          '수량': { number: qty || 0 },
          '발생날짜': { date: { start: date || new Date().toISOString().split('T')[0] } },
        },
      });
      return res.status(200).json({ success: true, data: response });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
