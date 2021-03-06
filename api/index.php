<?php
/**
 * Serialgraphy
 * https://www.facebook.com/serialgraphy
 *
 * Released Under MIT License
 * http://opensource.org/licenses/MIT
 */
// Init
// ------------------------------------------------------
define('CACHE_TYPE', 'file');
define('CACHE_FOLDER', dirname(__FILE__).'/cache/');
require 'cache.class.php';

// Cache
// ------------------------------------------------------
$cache     = Cache::getInstance();
$cachename = 'trakt';
$json      = $cache->getVar($cachename);
$traktKey  = "__YOUR_TRAKT_TV_API_KEY__";

// If False
// ------------------------------------------------------
if( $json === false )
{
    $data   = file_get_contents('http://api.trakt.tv/calendar/shows.json/' . $traktKey);
    $data   = json_decode($data);
    $genres = array('Animation', 'Home and Garden', 'Documentary', 'News', 'Children', 'Talk Show', 'Game Show', 'Sport', 'Soap', 'Reality');

    foreach($data as $k => $day)
    {
        $tmp = array();

        foreach($day->episodes as $episode)
        {
            if( $episode->show->country == 'United States' && $episode->show->ratings->percentage > 0 )
            {
                $found = false;

                foreach($episode->show->genres as $genre)
                {
                    if( in_array($genre, $genres) ){
                        $found = true;
                        continue;
                    }
                }

                if( !$found ) $tmp[] = $episode;
            }
        }

        $data[$k]->episodes = $tmp;
    }

    $json = json_encode($data);
    $cache->setVar($cachename, $json, 21600);
}

// Deliever
// ------------------------------------------------------
header('Content-Type: application/json');
die($_GET['callback'] . "(" . $json . ")");