<?php

json_response(200, [
    'service' => 'CampusMate API',
    'status' => 'ok',
    'timestamp' => date(DATE_ATOM),
    'stack' => ['PHP', 'MySQL', 'AJAX', 'JSON'],
]);

