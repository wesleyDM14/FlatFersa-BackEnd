import fs from 'fs';
import { CronJob } from "cron";

async function clearDirectory() {
    const directory = './uploads/';
    fs.readdir(directory, (err, files) => {
        if (err) {
            console.log(err);
            return;
        }

        for (const file of files) {
            fs.unlink(directory + file, (err) => {
                if (err) {
                    console.log(err);
                    return;
                }
            });
        }
    });
    console.log('Pasta de Uploads limpa com sucesso.');
}

const job = new CronJob('0 0 * * *', clearDirectory);
job.start();

export { clearDirectory }