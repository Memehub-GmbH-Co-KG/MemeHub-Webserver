# MemeHub-Webserver

A simple koa api that allows saving votes for the MemeHub Awards 2019. 

## Setup

You should run the server using docker.

Run `npm run build` to create a local docker image called `leifb/memehub-webserver`.

## Start the server

Run the image using docker. You will need to mount the nominees directory and the users.json. It is also a good idea to mount a data directory, so that the collected data is persistent after the container has been removed. Furthermore, you will need to expose port 80 of the container to the outside, so that the clients can access it.

### With docker run

```sh
docker run 
    -v /path/to/data/dir:/data
    -v /path/to/nominees:/nominees
    -v /path/to/users.json:/users.json
    -p 1342:80
    -e "MHA_DATA_PATH=/data"
    -e "MHA_NOMINEES_PATH=/nominees"
    -e "MHA_USERS_PATH=/users.json"
    -e "MEDIA_URL=url.to.memehub.media-server"
    leifb/memehub-webserver
```

### With docker-compose
```yaml
version: "3.8"
services:
  mhwebserver:
    image: leifb/memehub-webserver
    restart: always
    volumes:
      - "/path/to/data/dir:/data"
      - "/path/to/nominees:/nominees"
      - "/path/to/users.json:/users.json"
    ports:
      - "1342:80"
    environment:
      MHA_DATA_PATH: /data
      MHA_NOMINEES_PATH: /nominees
      MHA_USERS_PATH: /users.json
      MEDIA_URL: url.to.memehub.media-serve
```

## Environment Variables

 - `MHA_DATA_PATH`: The location where votes will be stored
 - `MHA_NOMINEES_PATH`: The location of the nominees directory
 - `MHA_USERS_PATH`: The location of the users.json file
 - `MEDIA_URL`: The url to the [memehub media-server](https://github.com/Memehub-GmbH-Co-KG/MemeHub-MediaServer)

## API

Every request to the API has to include the query parameter `token`, containing the user token. If no token is provided, the server will return a `400`. If the token is not included in the `users.json`, the server will return a `401`.

For all requests containing data, the server expects a valid json in the request body.

### `GET /votes`

Returns the votes that are stored for the user.

Response format:
```json
{
    "category1": "memeid1",
    "category2": "memeid2"
}
```

### `POST /votes`

Overwrites the votes of the user.

Request format:
```json
{
    "category1": "memeid1",
    "category2": "memeid2"
}
```

Responds with `200` if ok, or `403` otherwise. 

### `GET /user`

Returns the name of the user.

Response format:
```json
{
    "name": "user name"
}
```

### `GET /nominees`

Returns all categories and nominees

Response format:
```json
{
    "category1": [
        {
            "id": "meme_id_1",
            "ext": "jpg",
            "mime": "image/jpeg",
            "path": "cache/meme_id_1.jpg"
        },
        {
            "id": "meme_id_2",
            "ext": "jpg",
            "mime": "image/jpeg",
            "path": "cache/meme_id_2.jpg"
        }
    ],
    "category2": [
        {
            "id": "meme_id_3",
            "ext": "jpg",
            "mime": "image/jpeg",
            "path": "cache/meme_id_3.jpg"
        },
        {
            "id": "meme_id_4",
            "ext": "jpg",
            "mime": "image/jpeg",
            "path": "cache/meme_id_5.jpg"
        }
    ]
}
```

## Formats

The server expects a directory with nominees and a json file with users that are allowed to vote.

### users.json (at `MHA_USERS_PATH`)

A dictionary with the user tokens (uuid v4) as the keys and the user object as values. The user objects have two properties: name and id. The name will be shown to the client so that he can be sure his token worked. The id is used to save the votes. It should be the user id used by telegram.

```json
{
    "5fd6d06f-4c7a-4f80-a4c5-e715324d02e3" : {
        "name": "user a",
        "id": 123
    },
    "4a45088f-f41f-49f3-a43a-747320130d90" : {
        "name": "user b",
        "id": 456
    },
    "8a6a2f87-32e7-4160-9aa1-c4bf160dc084" : {
        "name": "user c",
        "id": 789
    }
}
``` 

### nominees directory (at `MHA_NOMINEES_PATH`)

The nominees directory should contain sub-directories that represent the categories of the nominated memes. These subdirectories should contain the nominated memes of that category. This file type does not matter, but the name has to include the id, wrapped in square brackets. Make sure that these are the only square brackets in the file name.


Example folder structure:
```
nominees
  category1
    meme1[id1].jpg
    foobar[id2].png
  category2
    [id3]blabla.mp4
    this[id4]meme.txt
```