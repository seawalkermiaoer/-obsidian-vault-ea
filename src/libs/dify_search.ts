
import axios from 'axios';
import { parseDifyResp } from 'src/models/difySearchResp';
import { getObsidianPath } from './dify_mapping'; 
import { count } from 'console';
import { title } from 'process';

// If using TypeScript, you may need to install the type definitions:
// npm install --save-dev @types/axios
export async function difySearch(query: string, apiKey: string, userId: string) {
    console.log(query, apiKey, userId)
    try {
        const response = await axios.post(
            'http://localhost/v1/workflows/run',
            {
                inputs: {
                    "query": `${query}`,
                },
                response_mode: 'blocking',
                user: userId
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        // console.log(response.data)
        const results = parseDifyResp(response.data);
        // console.log(Array.isArray(results));

        // Parse results and extract title, content, and document_id
        const parsedResults = (results as any[]).map((result: { title: string; content: string; metadata: { document_id: string } }) => ({
            title: result.title,
            content: result.content,
            document_id: result.metadata.document_id
        }));
        // console.log(results);
        // console.log(parsedResults);
        const g = groupAndCountByTitle(parsedResults);
        // console.log(g);
        const ret = g.map((item) => ({
            uri: getObsidianPath(item.title),
            count: item.count,
            content: item.content,
            title: item.title
        }))
        return ret;

    } catch (error) {
        console.error('Error running workflow:', error);
        throw error;
    }
}

function groupAndCountByTitle(input: Array<{ title: string; content: string; document_id: string }>) {
    const groupedByTitle = input.reduce((acc, item) => {
        if (!acc[item.title]) {
            acc[item.title] = {
                count: 0,
                content: item.content
            }
        }
        acc[item.title].count++
        return acc
    }, {} as Record<string, { count: number; content: string }>)

    return Object.entries(groupedByTitle).map(([title, { count, content }]) => ({
        title,
        count,
        content,
        
    }))
}
