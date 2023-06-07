import { createClient } from "@supabase/supabase-js";
import { v4 } from 'uuid';

// Setup the Supabase client
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const embed = async (input: string) => {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "input": input,
            "model": "text-embedding-ada-002",
        })
    }).then((response) => response.json());
    return response.data[0].embedding;
}


interface SearchRequest {
    query: string;
    top_k: number;
    where: Record<string, any>;
}

interface SearchResponse {
    id: number;
    data: any;
    embedding: number[];
    hash: string;
    metadata: any;
    score: number;
}
const dataset = "farcaster-casts"
const start = new Date().getTime();
semanticSearch(undefined, dataset, "just trying out").catch(console.error).then((res) => {
    console.log(res);
    console.log('took', new Date().getTime() - start, 'ms');
})
async function semanticSearch(
    userId?: string,
    datasetId?: string,
    query?: string,
    where?: Record<string, any>,
    top_k = 5,
): Promise<any> {

    // If query is empty and no where are provided, return an empty list
    if (!query && !where) {
        return { query: query, similarities: [] };
    }

    // If the query is too big, return an error
    if (query.length > 4000) { // TODO: count token instead
        return {
            error:
                "Query is too long"
                + ", please see https://docs.embedbase.xyz/query-is-too-long"
        };
    }

    const queryEmbedding = await embed(query);

    const documents = await search(
        top_k,
        queryEmbedding,
        datasetId,
        userId,
        where
    );

    const similarities = documents.map(match => ({
        score: match.score,
        id: match.id,
        data: match.data,
        hash: match.hash,
        embedding: match.embedding,
        metadata: match.metadata
    }));

    return {
        id: v4(),
        dataset_id: datasetId,
        user_id: userId,
        created: new Date().getTime(),
        query: query,
        similarities: similarities
    };
}

async function search(
    top_k: number,
    vector: number[],
    dataset_id?: string,
    user_id?: string,
    where?: Record<string, any>
): Promise<SearchResponse[]> {
    const params: Record<string, any> = {
        query_embedding: vector,
        similarity_threshold: 0.1, // TODO: make this configurable
        match_count: top_k,
        query_dataset_ids: [dataset_id],
        query_user_id: user_id
    };

    if (where) {
        if (!(where instanceof Object)) {
            throw new Error("currently only object is supported for where");
        }

        const metadata_field = Object.keys(where)[0];
        const metadata_value = where[metadata_field];
        params["metadata_field"] = metadata_field;
        params["metadata_value"] = metadata_value;
    }

    const { data, error } = await supabase.rpc("match_documents", params);

    if (error) {
        throw error;
    }

    return data.map((row: any) => ({
        id: row["id"],
        data: row["data"],
        embedding: JSON.parse(row["embedding"]),
        hash: row["hash"],
        metadata: row["metadata"],
        score: row["score"]
    }));
}

// Expose the semanticSearch function for use in your API endpoint
export { semanticSearch };
