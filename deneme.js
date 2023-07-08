import { client } from "@gradio/client";


async function run() {
	const app = await client("https://facebook-musicgen--pmx66.hf.space/");
	const result = await app.predict(0, [		
				"Howdy!", // string  in 'Describe your music' Textbox component
	]);
	

	console.log(result);
}

run();
